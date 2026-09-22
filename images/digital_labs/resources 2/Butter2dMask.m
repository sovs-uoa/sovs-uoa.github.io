function mask = Butter2dMask(img, cutoffFrequency, nOrder)
% BUTTER2DMASK  2D Butterworth frequency-domain mask, DC at the centre.
%   mask = Butter2dMask(img, cutoffFrequency, nOrder) returns a mask the
%   same size as img (rows x cols), matching the fftshifted layout used
%   by computeDFTSpectra/showDFTSpectra/writeDFTSpectra, i.e. index
%   (row,col) corresponds to frequency (col,row) - centre in cycles/image.
%
%   H(r) = 1 / (1 + (r/cutoffFrequency)^(2*nOrder))
%   where r is distance from DC in cycles/image.
%
%   nOrder > 0 gives a low-pass mask (full pass at DC, rolling off with
%   increasing r); nOrder < 0 gives a high-pass mask. cutoffFrequency is
%   the radius, in cycles/image, at which H = 0.5.
%
%   cutoffFrequency = 0 is a degenerate case (division by zero for
%   r > 0, and 0/0 at DC): it is handled as an ideal DC-only pass for
%   nOrder > 0, and an ideal DC-only block for nOrder < 0.
arguments
    img (:,:,:) {mustBeNumeric}
    cutoffFrequency (1,1) double {mustBeNonnegative}
    nOrder (1,1) double {mustBeNonzero}
end

rows = size(img, 1);
cols = size(img, 2);

fx = -floor(cols/2) : (ceil(cols/2)-1);
fy = -floor(rows/2) : (ceil(rows/2)-1);
[u, v] = meshgrid(fx, fy);
r = sqrt(u.^2 + v.^2);

if cutoffFrequency == 0
    isDC = (r == 0);
    if nOrder > 0
        mask = double(isDC);
    else
        mask = double(~isDC);
    end
else
    mask = 1 ./ (1 + (r ./ cutoffFrequency) .^ (2*nOrder));
end

end
