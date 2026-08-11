function I = generate_ramp(N, r, I_min, I_max)
% GENERATE_RAMP  Create a 1D flat-ramp-flat luminance profile.
%
%   I = generate_ramp(N, r, I_min, I_max)
%
%   N      total number of samples
%   r      width of the ramp region (samples)
%   I_min  minimum pixel intensity (flat region before/after ramp)
%   I_max  maximum pixel intensity (flat region after/before ramp)
%
%   Example:
%       I = generate_ramp(100, 40, 5, 10);
%       plot(I);

    flat_len = (N - r) / 2;

    I = [I_min * ones(1, flat_len), ...
         linspace(I_min, I_max, r), ...
         I_max * ones(1, flat_len)];

end