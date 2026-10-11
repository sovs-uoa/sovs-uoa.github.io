function contrast = calculate_michelson_contrast(I_max, I_min, display_luminance, gamma, bit_depth)
%CALCULATE_MICHELSON_CONTRAST Luminance-based Michelson contrast from pixel values.
%
%   contrast = calculate_michelson_contrast(I_max, I_min, display_luminance, gamma, bit_depth)
%
%   I_max, I_min        - maximum and minimum PIXEL values (0 to 2^bit_depth - 1)
%   display_luminance   - peak luminance of the display, a_0
%   gamma                - display gamma (e.g. 2.2)
%   bit_depth            - bit depth of the image (e.g. 8)
%
%   Converts pixel value to luminance using L = display_luminance * (I / I_full_scale)^gamma,
%   then returns the Michelson contrast (L_max - L_min) / (L_max + L_min).

    I_full_scale = 2^bit_depth - 1;

    L_max = display_luminance * (I_max / I_full_scale)^gamma;
    L_min = display_luminance * (I_min / I_full_scale)^gamma;

    contrast = (L_max - L_min) / (L_max + L_min);
end
