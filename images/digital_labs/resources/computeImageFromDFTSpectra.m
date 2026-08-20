function img = computeImageFromDFTSpectra(amplitude, phase)
% COMPUTEIMAGEFROMDFTSPECTRA  Reconstruct a spatial-domain image from a
% zero-centred 2D DFT amplitude/phase pair (the inverse of
% computeDFTSpectra).
%   img = computeImageFromDFTSpectra(amplitude, phase) recombines
%   amplitude and phase into a complex spectrum, undoes the fftshift
%   applied by computeDFTSpectra, and inverse-transforms back to the
%   spatial domain. img is double precision, the same size as
%   amplitude/phase; any residual imaginary part from floating-point
%   rounding is discarded.
arguments
    amplitude (:,:) double
    phase (:,:) double
end

F = amplitude .* exp(1i * phase);
img = real(ifft2(ifftshift(F)));

end
