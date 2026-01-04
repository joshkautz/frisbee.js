/**
 * Player component - renders a humanoid player model.
 *
 * Features smooth interpolation, accessibility support,
 * team-colored jerseys, and throwing animation.
 *
 * @module components/entities/Player
 */

import { useRef, useMemo, useEffect, memo } from "react";
import { useFrame } from "@react-three/fiber";
import { A11y } from "@react-three/a11y";
import * as THREE from "three";
import { damp3, dampAngle } from "maath/easing";
import { useReducedMotion } from "@/hooks";
import { useSimulationStore } from "@/stores";
import { disc } from "@/ecs";
import {
  BODY_HEIGHT,
  BODY_RADIUS,
  HEAD_RADIUS,
  LEG_HEIGHT,
  LEG_RADIUS,
  LEG_PIVOT_OFFSET,
  ARM_LENGTH,
  ARM_RADIUS,
  ARM_TOTAL_LENGTH,
  ARM_PIVOT_OFFSET,
  SKIN_COLOR,
  PULL_ANIMATION_DURATION,
  THROW_ANIMATION_DURATION,
} from "@/constants";
import { getStandardMaterial, createUniqueMaterial } from "@/utils";
import type { PlayerProps } from "@/types";

// Shared skin material for all players (cached globally)
const skinMaterial = getStandardMaterial("playerSkin", { color: SKIN_COLOR });

// ============================================================================
// Animation Constants
// ============================================================================

/** Arm rest rotation on Z axis (slight angle outward from body) */
const ARM_REST_Z = Math.PI / 6; // +30 degrees outward

// ----------------------------------------------------------------------------
// Regular Throw Animation (forehand/sidearm style - arm stays on same side)
// ----------------------------------------------------------------------------

/** Throw wind-up phase - first 40% of animation */
const THROW_WINDUP_PHASE = 0.4;

/** Throw release phase - next 30% of animation */
const THROW_RELEASE_PHASE = 0.7;

/** Throw arm wind-up rotation on Z axis (arm stays outward) */
const THROW_WINDUP_Z = Math.PI / 6; // +30 degrees (outward, same side of body)

/** Throw arm wind-up rotation on X axis (arm cocks backward) */
const THROW_WINDUP_X = Math.PI / 3; // +60 degrees (backward)

/** Throw arm release rotation on Z axis (arm extends outward) */
const THROW_RELEASE_Z = Math.PI / 6; // +30 degrees (outward)

/** Throw arm release rotation on X axis (arm extends forward) */
const THROW_RELEASE_X = -Math.PI / 4; // -45 degrees (forward)

// ----------------------------------------------------------------------------
// Pull Animation (bigger forehand-style throw to start a point)
// ----------------------------------------------------------------------------

/** Pull wind-up phase - first 50% (big dramatic wind-up) */
const PULL_WINDUP_PHASE = 0.5;

/** Pull release phase - next 25% (explosive forward motion) */
const PULL_RELEASE_PHASE = 0.75;

/** Pull arm wind-up rotation on Z axis (arm stays outward) */
const PULL_WINDUP_Z = Math.PI / 4; // +45 degrees (outward)

/** Pull arm wind-up rotation on X axis (arm fully cocked back) */
const PULL_WINDUP_X = Math.PI / 2; // +90 degrees (fully backward)

/** Pull arm release rotation on Z axis (arm extends outward) */
const PULL_RELEASE_Z = Math.PI / 6; // +30 degrees (outward)

/** Pull arm release rotation on X axis (arm extends forward) */
const PULL_RELEASE_X = -Math.PI / 3; // -60 degrees (forward)

/** Body rotation during pull wind-up (slight rotation back for power) */
const PULL_BODY_WINDUP_Y = -Math.PI / 8; // -22.5 degrees (slight rotate back)

/** Body rotation during pull release (slight rotation through) */
const PULL_BODY_RELEASE_Y = Math.PI / 8; // +22.5 degrees (slight rotate forward)

// ----------------------------------------------------------------------------
// Running Animation
// ----------------------------------------------------------------------------

/** Minimum speed to trigger running animation (m/s) */
const RUN_SPEED_THRESHOLD = 0.5;

/** Running cycle frequency (cycles per second) */
const RUN_CYCLE_FREQUENCY = 3;

/** Maximum leg swing angle (radians) - forward/back from vertical */
const LEG_SWING_AMPLITUDE = Math.PI / 6; // ±30 degrees

/** Maximum arm swing angle during running (radians) */
const ARM_SWING_AMPLITUDE = Math.PI / 8; // ±22.5 degrees

// ----------------------------------------------------------------------------
// Marking Animation (jumping jacks for defender marking the thrower)
// ----------------------------------------------------------------------------

/** Marking animation cycle frequency (cycles per second) */
const MARK_CYCLE_FREQUENCY = 1.2;

/** Arms up angle for marking (from rest position toward overhead) */
const MARK_ARM_UP_Z = Math.PI / 2; // 90 degrees from body (horizontal)

/** Legs spread angle for marking (outward from vertical) */
const MARK_LEG_SPREAD_Z = Math.PI / 6; // 30 degrees outward

/** Jump height during marking animation (meters) */
const MARK_JUMP_HEIGHT = 0.15;

/**
 * Smooth easing function for natural motion.
 * Uses smoothstep for buttery animation.
 */
function smoothstep(t: number): number {
  return t * t * (3 - 2 * t);
}

/**
 * Easing for wind-up phase (ease out - starts fast, slows down)
 */
function easeOutQuad(t: number): number {
  return 1 - (1 - t) * (1 - t);
}

/**
 * Easing for release phase (ease in - starts slow, speeds up)
 */
function easeInQuad(t: number): number {
  return t * t;
}

export const Player = memo(function Player({ entity, color }: PlayerProps) {
  const groupRef = useRef<THREE.Group>(null);
  const bodyRef = useRef<THREE.Group>(null);
  const rightArmPivotRef = useRef<THREE.Group>(null); // Pivot at shoulder for rotation
  const leftArmPivotRef = useRef<THREE.Group>(null); // Pivot at shoulder for running
  const leftLegPivotRef = useRef<THREE.Group>(null); // Pivot at hip for running
  const rightLegPivotRef = useRef<THREE.Group>(null); // Pivot at hip for running
  const targetPosition = useRef(new THREE.Vector3());
  const prefersReducedMotion = useReducedMotion();
  const simulationSpeed = useSimulationStore((s) => s.simulationSpeed);

  // Throw/pull animation state (one-shot animations with progress)
  const throwAnimationRef = useRef({
    isAnimating: false,
    isPull: false, // true for pull, false for regular throw
    progress: 0,
    wasThrowingState: false,
    wasPullingState: false,
  });

  // Cyclic limb animation phases (continuous oscillating animations)
  // Consolidated into single ref to minimize overhead
  const cyclicAnimationRef = useRef({
    runningPhase: 0, // Running cycle position (0 to 2π)
    markingPhase: 0, // Marking/jumping-jack cycle position (0 to 2π)
  });

  // Reusable vector for hand position calculation (per-instance to avoid shared state)
  const handOffsetRef = useRef(new THREE.Vector3());

  // Create jersey material per color (unique per instance)
  const jerseyMaterial = useMemo(
    () => createUniqueMaterial(THREE.MeshStandardMaterial, { color }),
    [color]
  );

  // Dispose jersey material on unmount or color change
  useEffect(() => {
    return () => jerseyMaterial.dispose();
  }, [jerseyMaterial]);

  // Store mesh ref in entity
  useEffect(() => {
    if (groupRef.current && entity.meshRef) {
      entity.meshRef.mesh = groupRef.current;
    }
  }, [entity]);

  // Interpolation to ECS position and throwing animation
  useFrame((_, delta) => {
    if (!groupRef.current) return;

    // Update target from ECS
    targetPosition.current.set(
      entity.position.x,
      entity.position.y,
      entity.position.z
    );

    if (prefersReducedMotion) {
      // Instant position update for reduced motion
      groupRef.current.position.copy(targetPosition.current);

      // Instant rotation update
      if (
        entity.velocity &&
        (Math.abs(entity.velocity.x) > 0.1 || Math.abs(entity.velocity.z) > 0.1)
      ) {
        groupRef.current.rotation.y = Math.atan2(
          entity.velocity.x,
          entity.velocity.z
        );
      }
    } else {
      // Smooth damp to target position (better than lerp - physics-based)
      damp3(
        groupRef.current.position,
        targetPosition.current,
        0.15, // smoothTime - lower = faster response
        delta
      );

      // Rotate to face movement direction with smooth damping
      if (
        entity.velocity &&
        (Math.abs(entity.velocity.x) > 0.1 || Math.abs(entity.velocity.z) > 0.1)
      ) {
        const targetAngle = Math.atan2(entity.velocity.x, entity.velocity.z);
        dampAngle(groupRef.current.rotation, "y", targetAngle, 0.1, delta);
      }
    }

    // ========================================================================
    // Throw/Pull Animation
    // ========================================================================
    const anim = throwAnimationRef.current;
    const isThrowingState =
      entity.ai?.state === "throwing" && entity.player?.hasDisc;
    const isPullingState =
      entity.ai?.state === "pulling" && entity.player?.hasDisc;

    // Detect transition to throwing state - start throw animation
    if (isThrowingState && !anim.wasThrowingState && !anim.isAnimating) {
      anim.isAnimating = true;
      anim.isPull = false;
      anim.progress = 0;
    }
    anim.wasThrowingState = isThrowingState ?? false;

    // Detect transition to pulling state - start pull animation
    if (isPullingState && !anim.wasPullingState && !anim.isAnimating) {
      anim.isAnimating = true;
      anim.isPull = true;
      anim.progress = 0;
    }
    anim.wasPullingState = isPullingState ?? false;

    // Update animation
    if (anim.isAnimating && rightArmPivotRef.current) {
      const duration = anim.isPull
        ? PULL_ANIMATION_DURATION
        : THROW_ANIMATION_DURATION;
      anim.progress += (delta * simulationSpeed) / duration;

      if (anim.progress >= 1) {
        // Animation complete - reset to rest position
        anim.isAnimating = false;
        anim.progress = 0;
        rightArmPivotRef.current.rotation.set(0, 0, ARM_REST_Z);
        if (bodyRef.current) {
          bodyRef.current.rotation.y = 0;
        }
      } else if (anim.isPull) {
        // Pull animation (big wind-up with body rotation)
        let armRotX = 0;
        let armRotZ = ARM_REST_Z;
        let bodyRotY = 0;

        if (anim.progress < PULL_WINDUP_PHASE) {
          // Wind-up: arm goes way back, body rotates back
          const t = easeOutQuad(anim.progress / PULL_WINDUP_PHASE);
          armRotZ = ARM_REST_Z + (PULL_WINDUP_Z - ARM_REST_Z) * t;
          armRotX = PULL_WINDUP_X * t;
          bodyRotY = PULL_BODY_WINDUP_Y * t;
        } else if (anim.progress < PULL_RELEASE_PHASE) {
          // Release: explosive forward motion
          const phaseProgress =
            (anim.progress - PULL_WINDUP_PHASE) /
            (PULL_RELEASE_PHASE - PULL_WINDUP_PHASE);
          const t = easeInQuad(phaseProgress);
          armRotZ = PULL_WINDUP_Z + (PULL_RELEASE_Z - PULL_WINDUP_Z) * t;
          armRotX = PULL_WINDUP_X + (PULL_RELEASE_X - PULL_WINDUP_X) * t;
          bodyRotY =
            PULL_BODY_WINDUP_Y + (PULL_BODY_RELEASE_Y - PULL_BODY_WINDUP_Y) * t;
        } else {
          // Follow-through: arm and body return to rest
          const phaseProgress =
            (anim.progress - PULL_RELEASE_PHASE) / (1 - PULL_RELEASE_PHASE);
          const t = smoothstep(phaseProgress);
          armRotZ = PULL_RELEASE_Z + (ARM_REST_Z - PULL_RELEASE_Z) * t;
          armRotX = PULL_RELEASE_X * (1 - t);
          bodyRotY = PULL_BODY_RELEASE_Y * (1 - t);
        }

        rightArmPivotRef.current.rotation.set(armRotX, 0, armRotZ);
        if (bodyRef.current) {
          bodyRef.current.rotation.y = bodyRotY;
        }
      } else {
        // Regular throw animation (quick pass)
        let armRotX = 0;
        let armRotZ = ARM_REST_Z;

        if (anim.progress < THROW_WINDUP_PHASE) {
          // Wind-up: arm goes back and across body
          const t = easeOutQuad(anim.progress / THROW_WINDUP_PHASE);
          armRotZ = ARM_REST_Z + (THROW_WINDUP_Z - ARM_REST_Z) * t;
          armRotX = THROW_WINDUP_X * t;
        } else if (anim.progress < THROW_RELEASE_PHASE) {
          // Release: arm swings forward rapidly
          const phaseProgress =
            (anim.progress - THROW_WINDUP_PHASE) /
            (THROW_RELEASE_PHASE - THROW_WINDUP_PHASE);
          const t = easeInQuad(phaseProgress);
          armRotZ = THROW_WINDUP_Z + (THROW_RELEASE_Z - THROW_WINDUP_Z) * t;
          armRotX = THROW_WINDUP_X + (THROW_RELEASE_X - THROW_WINDUP_X) * t;
        } else {
          // Follow-through: arm returns to rest
          const phaseProgress =
            (anim.progress - THROW_RELEASE_PHASE) / (1 - THROW_RELEASE_PHASE);
          const t = smoothstep(phaseProgress);
          armRotZ = THROW_RELEASE_Z + (ARM_REST_Z - THROW_RELEASE_Z) * t;
          armRotX = THROW_RELEASE_X * (1 - t);
        }

        rightArmPivotRef.current.rotation.set(armRotX, 0, armRotZ);
      }
    }

    // ========================================================================
    // Marking Animation (jumping jacks - takes priority over running)
    // ========================================================================
    const discEntity = disc.first;
    const isMarking = discEntity?.stall?.markerId === entity.id;

    if (isMarking && !prefersReducedMotion) {
      // Advance marking cycle phase based on time (scaled by simulation speed)
      cyclicAnimationRef.current.markingPhase +=
        delta * simulationSpeed * MARK_CYCLE_FREQUENCY * Math.PI * 2;

      // Keep phase in 0-2π range
      if (cyclicAnimationRef.current.markingPhase > Math.PI * 2) {
        cyclicAnimationRef.current.markingPhase -= Math.PI * 2;
      }

      // Use absolute value of sin for smooth up-down motion (0 to 1 to 0)
      const markPhase = Math.abs(
        Math.sin(cyclicAnimationRef.current.markingPhase)
      );

      // Arms go from rest position up toward horizontal (both arms mirror each other)
      // Left arm: -ARM_REST_Z (rest) to -MARK_ARM_UP_Z (up)
      // Right arm: +ARM_REST_Z (rest) to +MARK_ARM_UP_Z (up)
      const leftArmZ = -ARM_REST_Z - (MARK_ARM_UP_Z - ARM_REST_Z) * markPhase;
      const rightArmZ = ARM_REST_Z + (MARK_ARM_UP_Z - ARM_REST_Z) * markPhase;

      if (leftArmPivotRef.current) {
        leftArmPivotRef.current.rotation.set(0, 0, leftArmZ);
      }
      if (rightArmPivotRef.current && !anim.isAnimating) {
        rightArmPivotRef.current.rotation.set(0, 0, rightArmZ);
      }

      // Legs spread outward and come back together
      // Left leg: spread to negative Z (outward left)
      // Right leg: spread to positive Z (outward right)
      const legSpread = MARK_LEG_SPREAD_Z * markPhase;

      if (leftLegPivotRef.current) {
        leftLegPivotRef.current.rotation.set(0, 0, -legSpread);
      }
      if (rightLegPivotRef.current) {
        rightLegPivotRef.current.rotation.set(0, 0, legSpread);
      }

      // Vertical jump - player jumps up when arms/legs are spread
      if (bodyRef.current) {
        bodyRef.current.position.y = MARK_JUMP_HEIGHT * markPhase;
      }
    } else {
      // Reset marking phase and jump position when not marking
      cyclicAnimationRef.current.markingPhase = 0;
      if (bodyRef.current) {
        bodyRef.current.position.y = 0;
      }

      // ========================================================================
      // Running Animation
      // ========================================================================
      const speed = Math.sqrt(
        (entity.velocity?.x ?? 0) ** 2 + (entity.velocity?.z ?? 0) ** 2
      );
      const isRunning = speed > RUN_SPEED_THRESHOLD;

      if (isRunning && !prefersReducedMotion) {
        // Advance run cycle phase based on time (scaled by simulation speed)
        cyclicAnimationRef.current.runningPhase +=
          delta * simulationSpeed * RUN_CYCLE_FREQUENCY * Math.PI * 2;

        // Keep phase in 0-2π range
        if (cyclicAnimationRef.current.runningPhase > Math.PI * 2) {
          cyclicAnimationRef.current.runningPhase -= Math.PI * 2;
        }

        const phase = cyclicAnimationRef.current.runningPhase;

        // Leg swing (X rotation - forward/back)
        // Left leg forward when right leg back (opposite phase)
        const leftLegSwing = Math.sin(phase) * LEG_SWING_AMPLITUDE;
        const rightLegSwing = Math.sin(phase + Math.PI) * LEG_SWING_AMPLITUDE;

        if (leftLegPivotRef.current) {
          leftLegPivotRef.current.rotation.x = leftLegSwing;
        }
        if (rightLegPivotRef.current) {
          rightLegPivotRef.current.rotation.x = rightLegSwing;
        }

        // Arm swing (opposite to legs - natural running motion)
        // Left arm swings with right leg, right arm swings with left leg
        const leftArmSwing = Math.sin(phase + Math.PI) * ARM_SWING_AMPLITUDE;
        const rightArmSwing = Math.sin(phase) * ARM_SWING_AMPLITUDE;

        if (leftArmPivotRef.current) {
          leftArmPivotRef.current.rotation.x = leftArmSwing;
        }

        // Only animate right arm running swing if NOT throwing/pulling
        if (rightArmPivotRef.current && !anim.isAnimating) {
          rightArmPivotRef.current.rotation.x = rightArmSwing;
        }
      } else if (!prefersReducedMotion) {
        // Reset limbs to neutral when stopped (but not during reduced motion)
        if (leftLegPivotRef.current) leftLegPivotRef.current.rotation.x = 0;
        if (rightLegPivotRef.current) rightLegPivotRef.current.rotation.x = 0;
        if (leftArmPivotRef.current) leftArmPivotRef.current.rotation.x = 0;
        // Don't reset right arm X rotation - let throw animation handle it
      }
    }

    // ========================================================================
    // Update Hand World Position for Disc Attachment
    // ========================================================================
    if (rightArmPivotRef.current && entity.handWorldPosition) {
      // Ensure world matrix is up to date after all rotations
      rightArmPivotRef.current.updateWorldMatrix(true, false);

      // Hand position in pivot group's local space.
      // The pivot group is at the shoulder, with the arm mesh offset inside.
      // Shoulder is at group origin (0), hand is at -ARM_TOTAL_LENGTH (full arm length down).
      const handLocalY = -ARM_TOTAL_LENGTH;

      // Create hand position in pivot group's local space (using per-instance vector)
      const handOffset = handOffsetRef.current;
      handOffset.set(0, handLocalY, 0);

      // Transform to world space using pivot group's world matrix
      handOffset.applyMatrix4(rightArmPivotRef.current.matrixWorld);

      // Store in ECS entity for disc system to read
      entity.handWorldPosition.x = handOffset.x;
      entity.handWorldPosition.y = handOffset.y;
      entity.handWorldPosition.z = handOffset.z;
      entity.handPositionInitialized = true;
    }
  });

  // Build accessible description
  const teamName = entity.player?.team === "home" ? "Home" : "Away";
  const playerNumber = entity.player?.number ?? 0;
  const role = entity.player?.role ?? "player";
  const hasDisc = entity.player?.hasDisc ? ", holding the disc" : "";
  const description = `${teamName} team ${role} number ${playerNumber}${hasDisc}`;

  return (
    <A11y role="content" description={description}>
      <group
        ref={groupRef}
        position={[entity.position.x, entity.position.y, entity.position.z]}
      >
        {/* Body group for rotation during pull animation */}
        <group ref={bodyRef}>
          {/* Body/Torso */}
          <mesh position={[0, LEG_HEIGHT + BODY_HEIGHT / 2, 0]} castShadow>
            <capsuleGeometry
              args={[BODY_RADIUS, BODY_HEIGHT - BODY_RADIUS * 2, 8, 16]}
            />
            <primitive object={jerseyMaterial} attach="material" />
          </mesh>

          {/* Head */}
          <mesh
            position={[0, LEG_HEIGHT + BODY_HEIGHT + HEAD_RADIUS, 0]}
            castShadow
          >
            <sphereGeometry args={[HEAD_RADIUS, 16, 16]} />
            <primitive object={skinMaterial} attach="material" />
          </mesh>

          {/* Left Leg - pivot group at hip for running animation */}
          <group
            ref={leftLegPivotRef}
            position={[-BODY_RADIUS / 2, LEG_HEIGHT, 0]}
          >
            <mesh position={[0, LEG_PIVOT_OFFSET, 0]} castShadow>
              <capsuleGeometry
                args={[LEG_RADIUS, LEG_HEIGHT - LEG_RADIUS * 2, 4, 8]}
              />
              <primitive object={jerseyMaterial} attach="material" />
            </mesh>
          </group>

          {/* Right Leg - pivot group at hip for running animation */}
          <group
            ref={rightLegPivotRef}
            position={[BODY_RADIUS / 2, LEG_HEIGHT, 0]}
          >
            <mesh position={[0, LEG_PIVOT_OFFSET, 0]} castShadow>
              <capsuleGeometry
                args={[LEG_RADIUS, LEG_HEIGHT - LEG_RADIUS * 2, 4, 8]}
              />
              <primitive object={jerseyMaterial} attach="material" />
            </mesh>
          </group>

          {/* Left Arm - pivot group at shoulder for running animation */}
          <group
            ref={leftArmPivotRef}
            position={[
              -(BODY_RADIUS + ARM_RADIUS),
              LEG_HEIGHT + BODY_HEIGHT - 0.2,
              0,
            ]}
            rotation={[0, 0, -ARM_REST_Z]} // Mirror of right arm rest position
          >
            <mesh position={[0, ARM_PIVOT_OFFSET, 0]} castShadow>
              <capsuleGeometry args={[ARM_RADIUS, ARM_LENGTH, 4, 8]} />
              <primitive object={skinMaterial} attach="material" />
            </mesh>
          </group>

          {/* Right Arm (animated for throwing/pulling) - pivot group at shoulder */}
          <group
            ref={rightArmPivotRef}
            position={[
              BODY_RADIUS + ARM_RADIUS,
              LEG_HEIGHT + BODY_HEIGHT - 0.2,
              0,
            ]}
            rotation={[0, 0, ARM_REST_Z]}
          >
            <mesh position={[0, ARM_PIVOT_OFFSET, 0]} castShadow>
              <capsuleGeometry args={[ARM_RADIUS, ARM_LENGTH, 4, 8]} />
              <primitive object={skinMaterial} attach="material" />
            </mesh>
          </group>
        </group>
      </group>
    </A11y>
  );
});
