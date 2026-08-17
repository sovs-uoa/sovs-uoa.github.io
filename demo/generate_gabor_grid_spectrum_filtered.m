% generate_gabor_grid_spectrum_filtered.m
%
% Shows the Gabor grid's magnitude spectrum before and after the same
% Butterworth low-pass / high-pass masks used in
% verify_gabor_grid_filtering.m, with the cutoff D0 drawn as a dashed
% circle. This is the frequency-space picture that explains WHY the
% image-space filtering works: the low-pass mask keeps only the inner
% cluster (the 4-9 cyc/image patches) and zeroes the outer ring, and
% the high-pass mask does the opposite.

clear; close all;

load('gabor_grid_16_truth.mat', 'lowFreqRange', 'highFreqRange');
img = im2double(imread('gabor_grid_16.png'));
N = size(img, 1);

D0 = mean([lowFreqRange(2), highFreqRange(1)]);
order = 4;

[xx, yy] = meshgrid(0:N-1, 0:N-1);
cx = N/2; cy = N/2;
D = hypot(xx-cx, yy-cy);
lowPassMask  = 1 ./ (1 + (D/D0).^(2*order));
highPassMask = 1 - lowPassMask;

F = fftshift(fft2(img));
amplitude       = abs(F);
amplitudeLow    = abs(F .* lowPassMask);
amplitudeHigh   = abs(F .* highPassMask);

gamma = 2;
toDisplay = @(A) (log(1+A) / log(1+max(amplitude(:)))) .^ gamma;

% Circle for the D0 cutoff, in the same (pixel-offset-from-centre) units
% as the spectrum axes.
theta = linspace(0, 2*pi, 200);
circX = cx + D0*cos(theta);
circY = cy + D0*sin(theta);

figure('Color', 'w', 'Position', [100 100 1400 420]);
tiledlayout(1, 3);

panels = {toDisplay(amplitude), toDisplay(amplitudeLow), toDisplay(amplitudeHigh)};
titles = {'Original spectrum', sprintf('Low-pass mask, D_0=%.0f', D0), ...
          sprintf('High-pass mask, D_0=%.0f', D0)};

% All the energy sits within highFreqRange(2) of DC -- zoom the display
% to that region (with a margin) instead of showing the mostly-empty
% full 320x320 spectrum, where the blobs would only be a few pixels wide.
zoomR = highFreqRange(2) * 1.4;

for k = 1:3
    nexttile();
    imagesc(panels{k});
    colormap(gca, gray); clim([0 1]); axis image;
    set(gca, 'YDir', 'normal');
    xlim([cx-zoomR, cx+zoomR]);
    ylim([cy-zoomR, cy+zoomR]);
    hold on;
    plot(circX, circY, 'r--', 'LineWidth', 1.2);
    hold off;
    title(titles{k});
    fontsize(14, 'points');
end

exportgraphics(gcf, 'gabor_grid_16_spectrum_filtered.png', 'Resolution', 300);
fprintf('Saved gabor_grid_16_spectrum_filtered.png\n');
