/**
 * Open Charms — Pendulum Physics Engine
 * Implements smooth swinging physics with inertia, damping, dragging elasticity,
 * ambient breeze, and window resize responsiveness.
 */
(function (root) {
  'use strict';

  class CharmPendulum {
    constructor(options = {}) {
      this.baseLength = options.baseLength || 130;
      this.currentLength = this.baseLength;
      this.gravity = options.gravity || 2200; // px/s^2
      this.damping = options.damping !== undefined ? options.damping : 1.15;
      this.swingIntensity = options.swingIntensity !== undefined ? options.swingIntensity : 1.0;
      this.animSpeed = options.animSpeed !== undefined ? options.animSpeed : 1.0;
      this.reducedMotion = !!options.reducedMotion;

      // Position state
      this.anchorRatio = options.anchorRatio !== undefined ? options.anchorRatio : 0.82;
      this.anchorY = 0;
      this.anchorX = this.computeAnchorX();

      this.angle = 0; // radians (0 is hanging straight down)
      this.angularVelocity = 0; // rad/s
      this.maxAngle = Math.PI * 0.44; // ~80 degrees max

      // Drag state
      this.isDragging = false;
      this.dragTargetX = this.anchorX;
      this.dragTargetY = this.baseLength;
      this.mouseHistory = []; // { x, y, t }
      this.historyCapacity = 6;
      this.dragStartTime = 0;
      this.dragStartPos = { x: 0, y: 0 };

      // Secondary motion (lag tilt for cute bounce)
      this.secondaryTilt = 0;
      this.time = Math.random() * 100; // offset phase

      // Wavy chain dynamics
      this.chainWave = options.chainWave !== undefined ? options.chainWave : 1.0;
      this.wavePhase = Math.random() * 10;
      this.waveDisp1 = 0; // Transverse deflection at 1/3
      this.waveDisp2 = 0; // Transverse deflection at 2/3
      this.waveVel1 = 0;
      this.waveVel2 = 0;

      // Callbacks
      this.onAnchorUpdate = options.onAnchorUpdate || null;
    }

    computeAnchorX() {
      const vw = typeof window !== 'undefined' ? window.innerWidth : 1200;
      const minX = 70;
      const maxX = Math.max(minX + 20, vw - 70);
      const computed = vw * this.anchorRatio;
      return Math.max(minX, Math.min(maxX, computed));
    }

    handleResize() {
      const prevX = this.anchorX;
      this.anchorX = this.computeAnchorX();
      if (Math.abs(prevX - this.anchorX) > 1 && this.onAnchorUpdate) {
        this.onAnchorUpdate(this.anchorX, this.anchorRatio);
      }
    }

    setAnchorRatio(ratio, notify = true) {
      this.anchorRatio = Math.max(0.05, Math.min(0.95, ratio));
      this.anchorX = this.computeAnchorX();
      if (notify && this.onAnchorUpdate) {
        this.onAnchorUpdate(this.anchorX, this.anchorRatio);
      }
    }

    setBaseLength(len) {
      this.baseLength = Math.max(50, Math.min(320, len));
      if (!this.isDragging) {
        this.currentLength = this.baseLength;
      }
    }

    setSwingIntensity(intensity) {
      this.swingIntensity = Math.max(0.2, Math.min(2.5, intensity));
    }

    setAnimSpeed(speed) {
      this.animSpeed = Math.max(0.4, Math.min(2.2, speed));
    }

    setChainWave(intensity) {
      this.chainWave = Math.max(0.0, Math.min(2.5, intensity));
    }

    setReducedMotion(enabled) {
      this.reducedMotion = !!enabled;
      if (this.reducedMotion) {
        this.angularVelocity = 0;
        this.angle = 0;
        this.secondaryTilt = 0;
        this.waveDisp1 = 0;
        this.waveDisp2 = 0;
        this.waveVel1 = 0;
        this.waveVel2 = 0;
      }
    }

    startDrag(clientX, clientY) {
      this.isDragging = true;
      this.dragStartTime = performance.now();
      this.dragStartPos = { x: clientX, y: clientY };
      this.dragTargetX = clientX;
      this.dragTargetY = clientY;
      this.mouseHistory = [{ x: clientX, y: clientY, t: performance.now() }];
      this.angularVelocity = 0;
    }

    dragMove(clientX, clientY) {
      if (!this.isDragging) return;

      this.dragTargetX = clientX;
      this.dragTargetY = clientY;

      const now = performance.now();
      this.mouseHistory.push({ x: clientX, y: clientY, t: now });
      if (this.mouseHistory.length > this.historyCapacity) {
        this.mouseHistory.shift();
      }

      // Smoothly shift the top anchor horizontally if dragged sideways
      const vw = typeof window !== 'undefined' ? window.innerWidth : 1200;
      const minX = 70;
      const maxX = Math.max(minX + 20, vw - 70);

      // If user drags horizontally beyond current anchor, slide anchor softly towards cursor
      const dxFromAnchor = clientX - this.anchorX;
      if (Math.abs(dxFromAnchor) > 30) {
        const followSpeed = 0.08;
        const targetAnchorX = Math.max(minX, Math.min(maxX, clientX));
        this.anchorX += (targetAnchorX - this.anchorX) * followSpeed;
        this.anchorRatio = this.anchorX / vw;
        if (this.onAnchorUpdate) {
          this.onAnchorUpdate(this.anchorX, this.anchorRatio);
        }
      }
    }

    endDrag() {
      if (!this.isDragging) return { wasClick: false };

      const duration = performance.now() - this.dragStartTime;
      const lastPos = this.mouseHistory[this.mouseHistory.length - 1] || { x: this.dragTargetX, y: this.dragTargetY };
      const dist = Math.hypot(lastPos.x - this.dragStartPos.x, lastPos.y - this.dragStartPos.y);

      this.isDragging = false;

      // Check if this was a quick tap/click without moving much
      const wasClick = duration < 320 && dist < 8;

      if (wasClick) {
        // Playful gentle tap poke
        const pokeDir = Math.random() > 0.5 ? 1 : -1;
        this.applyImpulse(pokeDir * (1.8 + Math.random() * 1.2));
        return { wasClick: true };
      }

      // Calculate release velocity from recent mouse history
      if (this.mouseHistory.length >= 2 && !this.reducedMotion) {
        const oldest = this.mouseHistory[0];
        const newest = this.mouseHistory[this.mouseHistory.length - 1];
        const dt = (newest.t - oldest.t) / 1000;

        if (dt > 0.01 && dt < 0.35) {
          const vx = (newest.x - oldest.x) / dt;
          const vy = (newest.y - oldest.y) / dt;

          // Convert Cartesian release velocity to tangential angular impulse:
          // v_tangential = vx * cos(theta) - vy * sin(theta)
          const vTangential = vx * Math.cos(this.angle) - vy * Math.sin(this.angle);
          const angularImpulse = (vTangential / Math.max(50, this.currentLength)) * 1.3;

          // Clamp to safe dynamic limit
          const maxImpulse = 14;
          this.angularVelocity = Math.max(-maxImpulse, Math.min(maxImpulse, angularImpulse));

          // Transfer wave pulse to chain on release
          this.waveVel1 += angularImpulse * 12 * this.chainWave;
          this.waveVel2 -= angularImpulse * 16 * this.chainWave;
        }
      }

      return { wasClick: false };
    }

    applyImpulse(angularVelocityDelta) {
      if (this.reducedMotion) return;
      const maxV = 16;
      this.angularVelocity = Math.max(-maxV, Math.min(maxV, this.angularVelocity + angularVelocityDelta * this.swingIntensity));

      // Excite dynamic traveling S-curve wave down the chain
      this.waveVel1 += angularVelocityDelta * 14 * this.chainWave;
      this.waveVel2 -= angularVelocityDelta * 18 * this.chainWave;
    }

    applyScrollSway(impulse) {
      if (this.reducedMotion) return;

      // Gentle, natural air resistance response to page scrolling
      // Rather than unbounded kicks, limit the scroll contribution strictly to avoid violent whipping
      const maxScrollVel = 1.6;
      const scaledImpulse = impulse * 0.4 * this.swingIntensity;

      // Softly nudge velocity without flinging wildly
      this.angularVelocity = Math.max(-maxScrollVel, Math.min(maxScrollVel, this.angularVelocity + scaledImpulse));

      // Subtle, pleasant wave excitation (1.8x - 2.2x instead of 14x - 18x)
      this.waveVel1 += scaledImpulse * 1.8 * this.chainWave;
      this.waveVel2 -= scaledImpulse * 2.2 * this.chainWave;
    }

    update(rawDt) {
      // Clamp dt to avoid physics exploding during tab suspend or frame drops
      const dt = Math.min(rawDt || 0.016, 0.033) * this.animSpeed;
      this.time += dt;

      if (this.isDragging) {
        // While dragging: compute angle and spring distance to mouse
        const dx = this.dragTargetX - this.anchorX;
        const dy = Math.max(20, this.dragTargetY - this.anchorY); // charm hangs downwards

        const targetAngle = Math.atan2(dx, dy);
        this.angle = Math.max(-this.maxAngle, Math.min(this.maxAngle, targetAngle));

        const targetLength = Math.hypot(dx, dy);
        // Elastic pull: allow length to stretch between 0.6x and 1.8x base length
        const clampedTargetLength = Math.max(this.baseLength * 0.6, Math.min(this.baseLength * 1.8, targetLength));
        this.currentLength += (clampedTargetLength - this.currentLength) * 0.35;

        // Secondary tilt tracks current angle smoothly
        this.secondaryTilt += (this.angle - this.secondaryTilt) * 0.25;

        // Wave updates while dragging
        this.updateChainWave(dt);
        return;
      }

      // Free swinging state
      // Smooth return of length to base length
      this.currentLength += (this.baseLength - this.currentLength) * 0.12;

      if (this.reducedMotion) {
        // Rapidly damp down motion in reduced motion mode
        this.angularVelocity *= 0.8;
        this.angle *= 0.85;
        this.secondaryTilt *= 0.85;
        this.waveDisp1 *= 0.8;
        this.waveDisp2 *= 0.8;
        if (Math.abs(this.angle) < 0.001) {
          this.angle = 0;
          this.angularVelocity = 0;
          this.secondaryTilt = 0;
          this.waveDisp1 = 0;
          this.waveDisp2 = 0;
        }
        return;
      }

      // Ambient natural breeze when charm is almost at rest
      const isNearlyStill = Math.abs(this.angularVelocity) < 0.4 && Math.abs(this.angle) < 0.08;
      let idleBreeze = 0;
      if (isNearlyStill) {
        idleBreeze = 0.05 * Math.sin(this.time * 2.2) * Math.cos(this.time * 0.9);
      }

      // Standard pendulum equation with gravity, damping, and intensity
      // alpha = - (g / L) * sin(theta) - damping * omega + breeze
      const restoringForce = -(this.gravity / Math.max(50, this.currentLength)) * Math.sin(this.angle) * this.swingIntensity;
      const dampingForce = -this.damping * this.angularVelocity;
      const angularAcceleration = restoringForce + dampingForce + idleBreeze;

      // Semi-implicit Euler integration
      this.angularVelocity += angularAcceleration * dt;
      this.angle += this.angularVelocity * dt;

      // Soft bounce if hitting max angle
      if (this.angle > this.maxAngle) {
        this.angle = this.maxAngle;
        this.angularVelocity = -Math.abs(this.angularVelocity) * 0.4;
      } else if (this.angle < -this.maxAngle) {
        this.angle = -this.maxAngle;
        this.angularVelocity = Math.abs(this.angularVelocity) * 0.4;
      }

      // Secondary character lag tilt (gives lovely organic weight)
      const targetSecondary = this.angle + (this.angularVelocity * 0.06);
      this.secondaryTilt += (targetSecondary - this.secondaryTilt) * 0.2;

      // Update wavy chain physics
      this.updateChainWave(dt);
    }

    updateChainWave(dt) {
      if (this.chainWave <= 0.01 || this.reducedMotion) {
        this.waveDisp1 *= 0.8;
        this.waveDisp2 *= 0.8;
        this.waveVel1 = 0;
        this.waveVel2 = 0;
        return;
      }

      this.wavePhase += dt * 4.8;

      // Dynamic inertial deflection caused by swinging angular velocity
      const inertiaForce1 = -this.angularVelocity * 10 * this.chainWave;
      const inertiaForce2 = -this.angularVelocity * 15 * this.chainWave;

      // Traveling harmonic undulation along the string
      const ripple1 = Math.sin(this.wavePhase) * 3.2 * this.chainWave;
      const ripple2 = Math.sin(this.wavePhase - 1.25) * 4.8 * this.chainWave;

      // Drag velocity excitation
      let dragRipple = 0;
      if (this.isDragging && this.mouseHistory.length >= 2) {
        const mNew = this.mouseHistory[this.mouseHistory.length - 1];
        const mOld = this.mouseHistory[this.mouseHistory.length - 2];
        dragRipple = (mNew.x - mOld.x) * 0.35 * this.chainWave;
      }

      const targetDisp1 = inertiaForce1 + ripple1 + dragRipple;
      const targetDisp2 = inertiaForce2 + ripple2 - dragRipple * 0.45;

      // Damped harmonic oscillator integration for Bezier control points
      const springK = 38;
      const dampingC = 7.2;

      const force1 = (targetDisp1 - this.waveDisp1) * springK - this.waveVel1 * dampingC;
      this.waveVel1 += force1 * dt;
      this.waveDisp1 += this.waveVel1 * dt;

      const force2 = (targetDisp2 - this.waveDisp2) * springK - this.waveVel2 * dampingC;
      this.waveVel2 += force2 * dt;
      this.waveDisp2 += this.waveVel2 * dt;

      // Clamp wave deflection to reasonable bounds
      const maxDisp = 35 * this.chainWave;
      this.waveDisp1 = Math.max(-maxDisp, Math.min(maxDisp, this.waveDisp1));
      this.waveDisp2 = Math.max(-maxDisp, Math.min(maxDisp, this.waveDisp2));
    }

    getRenderState() {
      const sinA = Math.sin(this.angle);
      const cosA = Math.cos(this.angle);

      // Charm attachment ring position (x, y)
      const charmX = this.anchorX + this.currentLength * sinA;
      const charmY = this.anchorY + this.currentLength * cosA;

      // Tilt angle in degrees for SVG transformation
      const tiltDeg = (this.secondaryTilt * 180) / Math.PI;

      // Compute Cubic Bezier wave control points (P1, P2)
      // Chord vector from P0 (anchorX, anchorY) to P3 (charmX, charmY)
      const dx = charmX - this.anchorX;
      const dy = charmY - this.anchorY;
      const chordLen = Math.hypot(dx, dy) || 1;

      // Unit normal vector perpendicular to chord (pointing sideways)
      const nx = -dy / chordLen;
      const ny = dx / chordLen;

      // Control points P1 (at 1/3) and P2 (at 2/3) with wave displacement
      const p1x = this.anchorX + dx * 0.333 + nx * this.waveDisp1;
      const p1y = this.anchorY + dy * 0.333 + ny * this.waveDisp1;

      const p2x = this.anchorX + dx * 0.667 + nx * this.waveDisp2;
      const p2y = this.anchorY + dy * 0.667 + ny * this.waveDisp2;

      return {
        anchorX: this.anchorX,
        anchorY: this.anchorY,
        charmX,
        charmY,
        p1x,
        p1y,
        p2x,
        p2y,
        waveDisp1: this.waveDisp1,
        waveDisp2: this.waveDisp2,
        angleRad: this.angle,
        angleDeg: (this.angle * 180) / Math.PI,
        tiltDeg,
        length: this.currentLength,
        isDragging: this.isDragging
      };
    }
  }

  const OpenCharmsPhysics = {
    create(options) {
      return new CharmPendulum(options);
    }
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = OpenCharmsPhysics;
  } else {
    root.OpenCharmsPhysics = OpenCharmsPhysics;
  }
})(typeof globalThis !== 'undefined' ? globalThis : window);
