// Blur reveal (https://design.how/vault/blur-reveal), reveal-shader.ts.
// FIXED. Change the VARIABLE values in params instead (PANELS, HOLD_MS, BG_MS, MAX_BLUR, K_IN, K_OUT).
export const REVEAL_VERT =  `
  attribute vec2 aPosition; // -1..1 fullscreen-ish quad
  attribute vec2 aUV;
  varying vec2 vUV;
  void main(){
    vUV = aUV;
    gl_Position = vec4(aPosition, 0.0, 1.0);
  }
`;

export const REVEAL_FRAG =  `
  precision highp float;
  uniform sampler2D uTex;
  uniform vec2  uTexel;    // 1/textureSize, for blur tap spacing
  uniform float uProgress; // 0 = hidden, 1 = fully revealed
  uniform float uMaxBlur;  // starting blur radius in texels
  uniform vec3  uEdge;     // color of the glowing band that travels with the reveal front
  uniform float uTime;     // seconds, for the slowly-drifting dissolve field
  uniform float uAspect;   // card w/h, so the radial bias is round not oval
  uniform float uSeed;     // per-panel offset into the noise field → each cycle differs
  varying vec2 vUV;

  // cheap value noise for the dissolve mask
  float hash(vec2 p){ return fract(sin(dot(p, vec2(41.3, 289.1))) * 43758.5453); }
  float noise(vec2 p){
    vec2 i = floor(p), f = fract(p);
    f = f*f*(3.0-2.0*f);
    float a = hash(i), b = hash(i+vec2(1,0)), c = hash(i+vec2(0,1)), d = hash(i+vec2(1,1));
    return mix(mix(a,b,f.x), mix(c,d,f.x), f.y);
  }

  // Strong gaussian-ish blur: two rings of taps (inner + outer) plus center, at the
  // given radius in texels. A wide radius here genuinely softens the glyphs so the
  // "materialize into focus" reads clearly (a single 9-tap at a small radius did not).
  vec4 blurTex(vec2 uv, float radius){
    if (radius < 0.35) return texture2D(uTex, uv);
    vec2 r1 = uTexel * radius;         // inner ring
    vec2 r2 = uTexel * radius * 2.0;   // outer ring (wider spread = more visible blur)
    vec4 sum = texture2D(uTex, uv) * 1.0;
    float wsum = 1.0;
    // 8 directions, two radii each = 16 taps + center
    for (int i = 0; i < 8; i++){
      float a = float(i) * 0.785398; // 45° steps
      vec2 dir = vec2(cos(a), sin(a));
      sum += texture2D(uTex, uv + dir * r1) * 0.75; wsum += 0.75;
      sum += texture2D(uTex, uv + dir * r2) * 0.5;  wsum += 0.5;
    }
    return sum / wsum;
  }

  // fractal (multi-octave) noise — a turbulent field for an organic, wispy dissolve
  float fbm(vec2 p){
    float v = 0.0, amp = 0.5;
    for (int i = 0; i < 4; i++){
      v += amp * noise(p);
      p *= 2.03;      // lacunarity
      amp *= 0.5;     // gain
    }
    return v;
  }

  void main(){
    // Fully revealed → cheap path (just sample the sharp texture).
    if (uProgress >= 0.999) { gl_FragColor = texture2D(uTex, vUV); return; }

    // Overdrive so the reveal fully completes a hair before progress hits 1.
    float p = uProgress * 1.3;

    // Dissolve mask (A): NO left→right column wipe — a purely 2D fractal field, so the
    // front varies WITHIN each letter (not a whole glyph-column flipping at once). A
    // domain-warp gives wispy tendrils, a soft radial bias makes it bloom from center
    // outward, and a slow uTime drift makes the emerging front shimmer as it advances.
    // uSeed shifts the whole field per panel (and nudges the radial center) so no two
    // cycles dissolve the same way — the tendrils and bloom differ every time.
    vec2 sd = vec2(uSeed * 1.7, uSeed * -1.3);
    vec2 rc = (vUV - 0.5) * vec2(uAspect, 1.0);        // aspect-correct, centered
    rc += vec2(sin(uSeed * 2.3), cos(uSeed * 1.9)) * 0.12; // wander the bloom center
    float radial = length(rc) * 0.9;                    // 0 center → ~0.6 corners
    vec2 warp = vec2(fbm(vUV * 3.2 + sd + uTime * 0.05 + 11.0),
                     fbm(vUV * 3.2 - sd - uTime * 0.04 - 7.0)) - 0.5;
    float turb = fbm(vUV * 5.5 + warp * 1.7 + sd + uTime * 0.06);
    float mask = mix(radial, turb, 0.7);                // 0..1: per-pixel front position

    // reveal alpha (B): a WIDE, symmetric feathered band — no hard discard. Pixels ease
    // in over a broad range so the leading contour never winks on. Only skip pixels that
    // are still fully ahead of the front.
    float reveal = smoothstep(p + 0.34, p - 0.34, mask);
    if (reveal <= 0.0) discard;

    // Blur is LOCALIZED TO THE FRONT: max at the leading edge, crisp behind it — so
    // each part is soft as it emerges then settles sharp. (Not an all-over blur.)
    float blurAmt = smoothstep(p - 0.5, p + 0.34, mask); // 1 at/ahead of front, 0 behind

    // Front motion (C): un-resolved regions are sampled nudged slightly toward center +
    // lifted a touch, then scaled fractionally larger — so emerging letters drift into
    // place instead of fading in stationary. Decays to zero as each region resolves.
    vec2 drift = (-rc * 0.010 + vec2(0.0, 0.006)) * blurAmt; // toward center + up
    float grow = 1.0 + 0.03 * blurAmt;                        // subtle scale-up
    vec2 suv = (vUV - 0.5) / grow + 0.5 + drift;

    float radius = blurAmt * uMaxBlur;                  // in texels
    vec4 tex = blurTex(suv, radius);

    // Glow band: a SOFT, WIDE front that rides the advancing reveal edge (peaks where
    // mask ≈ p). Wider band + gentler falloff = a smooth wash, not a hard flare. Fades
    // out as the line finishes (progress 0.8→1).
    float fw = 0.30; // wider = smoother, more diffuse
    float flare = smoothstep(p - fw, p, mask) * smoothstep(p + fw, p, mask);
    flare *= 1.0 - smoothstep(0.8, 1.0, uProgress);

    // A HALO: sample the glyph alpha with a wide blur so the glow spills BEYOND the
    // letter edges (a real outline, visible in the gaps), not just on the ink.
    vec4 wide = blurTex(suv, uMaxBlur * 1.3);
    float halo = wide.a;

    vec3 rgb = tex.rgb;
    // ADD a WEAK luminous edge that rides the front: a gentle glow (uEdge only slightly
    // lifted toward white) added softly on the ink AND the surrounding halo, so it reads
    // as a subtle outline in the gaps — present but never hot.
    vec3 glow = mix(uEdge, vec3(1.0), 0.3); // only a little toward white = soft, on-color
    rgb += glow * flare * (tex.a * 0.6 + halo * 0.5); // weak
    float alpha = max(tex.a * reveal, halo * flare * 0.5);

    gl_FragColor = vec4(rgb, alpha);
  }
`;
