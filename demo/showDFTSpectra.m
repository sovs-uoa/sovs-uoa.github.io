function showDFTSpectra(img, amplitude, phase, cutoff)
% SHOWDFTSPECTRA  Display an image alongside its amplitude and phase spectra.
%   showDFTSpectra(img, amplitude, phase) plots the original image, the
%   amplitude spectrum on a log scale (with a gamma boost for contrast),
%   and the phase spectrum. Both spectra use the Cartesian +f_y-up
%   convention (YDir normal) and assume amplitude/phase are already
%   centred on DC, e.g. as returned by computeDFTSpectra.
%
%   showDFTSpectra(img, amplitude, phase, cutoff) additionally overlays a
%   dashed circle of radius cutoff (in cycles/image) centred on DC, on
%   both the amplitude and phase spectra -- e.g. to mark a Butterworth
%   cutoff frequency you have chosen.
arguments
    img
    amplitude (:,:) double
    phase (:,:) double
    cutoff (1,1) double = 0
end

gamma = 2;
logAmplitude = log(1 + amplitude);
displayAmplitude = (logAmplitude / max(logAmplitude(:))) .^ gamma;

% amplitude/phase are already fftshifted (DC at the centre), so index
% (row,col) corresponds to a frequency of (row,col) - centre in
% cycles/image -- build that axis so the plots read directly in those
% units instead of raw array indices.
[rows, cols] = size(amplitude);
fx = -floor(cols/2) : (ceil(cols/2)-1);
fy = -floor(rows/2) : (ceil(rows/2)-1);

% Cutoff ring, if requested -- drawn in data units (cycles/image) so it
% overlays correctly regardless of image size.
showRing = cutoff > 0;
if showRing
    theta = linspace(0, 2*pi, 200);
    ringX = cutoff * cos(theta);
    ringY = cutoff * sin(theta);
end

figure('Color', 'w', 'Position', [100 100 1200 420]);
tiledlayout(1, 3);

nexttile();
imshow(img);
title('Image');
fontsize(14, 'points');

nexttile();
imagesc(fx, fy, displayAmplitude);
colormap(gca, gray); clim([0 1]); axis image;
set(gca, 'YDir', 'normal');
xlabel('cycles/img'); ylabel('cycles/img');
title('Amplitude spectrum (log)');
fontsize(14, 'points');
colorbar;
if showRing
    hold on;
    plot(ringX, ringY, 'r--', 'LineWidth', 1.5);
    hold off;
end

nexttile();
imagesc(fx, fy, phase);
colormap(gca, gray); axis image;
set(gca, 'YDir', 'normal');
xlabel('cycles/img'); ylabel('cycles/img');
title('Phase spectrum');
fontsize(14, 'points');
colorbar;
if showRing
    hold on;
    plot(ringX, ringY, 'r--', 'LineWidth', 1.5);
    hold off;
end

end
