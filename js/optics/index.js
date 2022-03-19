/* -------------------------------------------------------

COMPARED AGAINST LEGRANS RELAXED SCHEMATIC EYE - Passed.

----------------------------------------------------------- */

var optics = require('./optics.js');
const util = require('util');

optics.load('legrand-relaxed-schematic-eye.lens', function (lens) {

  // optical information 
  lens_data = optics.analyze(lens); // total prescription
  console.log(util.inspect(lens_data, { depth: 3}));

  // get the part corresponding to the cornea 
  /*
  group = optics.extractGroup(lens, "cornea"); // add the surrouding media by default 
  group_data = optics.analyze(group); // total prescription
  console.log(group);
  console.log(util.inspect(group_data, { depth: 3}));
	*/

});