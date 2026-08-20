function [amplitude, phase] = computeDFTSpectra(img)
% COMPUTEDFTSPECTRA  2D DFT amplitude and phase spectra of an image.
%   [amplitude, phase] = computeDFTSpectra(img) computes the 2D DFT of
%   img (converted to grayscale double if needed), shifts it so DC sits
%   at the centre of the map, and returns the amplitude (magnitude) and
%   phase as two maps the same size as img.

if size(img, 3) == 3
    img = im2gray(img);
end
img = im2double(img);

F = fftshift(fft2(img));

amplitude = abs(F);
phase     = angle(F);

end
