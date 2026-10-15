/* Tests of the optics (js/optics/optics.js, materials.js), run with plain Node:   npm test
   They check the code against the textbook, not against its own output: Gaussian imaging, magnification, the lensmaker's
   formula for a thick lens, conjugates going both ways, an object at infinity, dispersion. */

const test   = require('node:test');
const assert = require('node:assert/strict');
const fs     = require('fs');
const path   = require('path');
const { loadOptics, readLens, systemOf, ROOT } = require('./harness.js');

const optics = loadOptics();
const close  = (a, b, tol, msg) => assert.ok(Math.abs(a - b) <= tol, `${msg || ''} expected ${b}, got ${a} (tolerance ${tol})`);
const system = rel => systemOf(optics, readLens(rel)).total;

/* --- a thick lens in air: the lensmaker's formula ------------------------------------------------------------- */

test('thick lens: power, focal lengths and principal points follow the thick-lens formulae', () => {
  const R = 0.10104517785130898, n = 1.523, t = 0.02;
  const F1 = (n - 1) / R, F2 = (n - 1) / R;                  // the two surfaces (back radius is -R)
  const F  = F1 + F2 - (t / n) * F1 * F2;                    // equivalent power
  const S  = system('lenses/components/thick-lens-positive.lens');

  close(S.F, F, 1e-9, 'equivalent power');
  close(S.cardinal.PF2, 1 / F, 1e-9, 'back focal length from P\'');
  close(S.cardinal.PF1, -1 / F, 1e-9, 'front focal length from P');
  close(S.cardinal.VP1, (t / n) * F2 / F, 1e-9, 'P lies behind the front vertex by t F2 / (n F)');
  close(S.cardinal.VP2, -(t / n) * F1 / F, 1e-9, "P' lies in front of the back vertex by t F1 / (n F)");
  close(S.cardinal.VF2, S.cardinal.PF2 + S.cardinal.VP2 + 0, 1e-9, "V'F' = P'F' + V'P'");
});

test('a minus thick lens has negative power and focal points on the opposite sides', () => {
  const S = system('lenses/components/thick-lens-negative.lens');
  assert.ok(S.F < 0);
  assert.ok(S.cardinal.PF2 < 0 && S.cardinal.PF1 > 0);
});

/* --- Gaussian imaging, over several systems -------------------------------------------------------------------- */

const IMAGING_SYSTEMS = [
  'lenses/components/thick-lens-positive.lens',
  'lenses/components/thick-lens-negative.lens',
  'lenses/components/thin-lens-positive.lens',
  'lenses/components/thin-lens-negative.lens',
  'lenses/eyes/schematic-reduced-eye-bare.lens',
  'lenses/eyes/legrand-relaxed-schematic-eye.lens'
].filter(f => fs.existsSync(path.join(ROOT, f)));

test('the test systems exist', () => { assert.ok(IMAGING_SYSTEMS.length >= 4, IMAGING_SYSTEMS.join()); });

IMAGING_SYSTEMS.forEach(file => {
  test(`Gaussian imaging and magnification: ${file}`, () => {
    const S = system(file);
    // object distances in metres, in front of the first vertex, chosen to avoid the focal point
    [-5, -1, -0.45, -0.31, -0.2, -0.1, -0.05].forEach(z => {
      const p = optics.calculateConjugatePairFrom({ id: 1, which: 'object', z: z, h: 0.01 }, S);
      if (!isFinite(p.PI) || Math.abs(p.PI) > 1e6) { return; }       // object at the focal point: image at infinity
      const l = p.PO, lp = p.PI;                                      // from the principal planes
      // n'/l' - n/l = F
      close(S.n2 / lp - S.n1 / l, S.F, 1e-6 * Math.max(1, Math.abs(S.F)), `vergence equation, z=${z}`);
      // lateral magnification m = n l' / (n' l)
      close(p.IQ / p.OQ, (S.n1 * lp) / (S.n2 * l), 1e-9, `magnification, z=${z}`);
    });
  });
});

/* --- the pair is the same going either way ------------------------------------------------------------------- */

IMAGING_SYSTEMS.forEach(file => {
  test(`object to image and back again: ${file}`, () => {
    const S = system(file);
    [-3, -0.8, -0.25].forEach(z => {
      const a = optics.calculateConjugatePairFrom({ id: 1, which: 'object', z: z, h: 0.007 }, S);
      if (!isFinite(a.VI) || Math.abs(a.VI) > 1e5) { return; }
      const b = optics.calculateConjugatePairFrom({ id: 1, which: 'image', z: a.VI, h: a.IQ }, S);
      close(b.VO, a.VO, 1e-6 * Math.max(1, Math.abs(a.VO)), `object distance, z=${z}`);
      close(b.OQ, a.OQ, 1e-9, `object height, z=${z}`);
    });
  });
});

/* --- a beam from infinity --------------------------------------------------------------------------------------- */

test('a beam from infinity focuses on the back focal plane, at n1 tan(angle) / F', () => {
  const S = system('lenses/components/thick-lens-positive.lens');
  const deg = 4;
  const p = optics.calculateConjugatePairFrom({ id: 1, type: 'beam', which: 'object', t: deg }, S);
  close(p.VI, S.cardinal.VF2, 1e-9, "image is at F' (V'F')");
  close(Math.abs(p.IQ), Math.abs(S.n1 / S.F) * deg * Math.PI / 180, 1e-9, 'image height');
});

test('the relaxed Le Grand eye focuses parallel light just in front of the retina', () => {
  const S = system('lenses/eyes/legrand-relaxed-schematic-eye.lens');
  // the retina is the "img" element; F' is the image of a distant object (22.289 mm from P')
  close(S.cardinal.PF2, 0.022289, 5e-6, "P'F' of the relaxed Le Grand eye");
  assert.ok(Math.abs(S.F - 1 / (S.cardinal.PF2 / S.n2)) < 0.05, 'power and focal length agree (n2/F)');
});

/* --- materials and dispersion ------------------------------------------------------------------------------------ */

test('materials: the index at the d line is n_d, and n_F - n_C gives the Abbe number', () => {
  const M = optics.Materials;
  M.list.filter(m => m.Vd).forEach(m => {
    close(M.indexAt(m, M.LAMBDA_D), m.nd, 1e-9, `${m.name} n_d`);
    const nFnC = M.indexAt(m, M.LAMBDA_F) - M.indexAt(m, M.LAMBDA_C);
    close((m.nd - 1) / nFnC, m.Vd, 1e-6, `${m.name} Abbe number`);
    assert.ok(M.indexAt(m, 435.8) > M.indexAt(m, 656.3), `${m.name}: blue is bent more than red`);
  });
  close(M.indexAt('Air', 500), 1, 0, 'air does not disperse');
});

/* --- every model the site offers builds a system ------------------------------------------------------------- */

test('every model in config.json builds a system without throwing', () => {
  const config = JSON.parse(fs.readFileSync(path.join(ROOT, 'config/config.json'), 'utf8'));
  const failures = [];
  config.models.forEach(m => {
    const file = m.filename.replace(/^\.\//, '');
    try {
      const S = systemOf(optics, readLens(file)).total;
      if (!S || S.n1 == null) { failures.push(`${m.id} ${file}: no system`); }
    } catch (e) { failures.push(`${m.id} ${file}: ${e.message}`); }
  });
  assert.deepEqual(failures, []);
});
