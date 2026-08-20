% generate_gabor_grid_spectrum.m
%
% Shows the magnitude spectrum of gabor_16.png (run
% generate_gabor_grid.m first). Expect 8 bright blobs on a ring at the
% low-frequency radius and 8 on a ring at the high-frequency radius,
% one pair of blobs per patch (each real sinusoid contributes energy at
% +f and -f), each blob smeared into a small disc rather than a sharp
% point -- the spatial localisation (Gaussian envelope, sigma=14px) of
% each patch trades off against how sharply it can be localised in
% frequency.

clear; close all;

load('gabor_grid_16_truth.mat', 'highFreqRange');
img = im2double(imread('gabor_16.png'));
N = size(img, 1);
cx = N/2; cy = N/2;

F = fftshift(fft2(img));
amplitude_spectrum = abs(F);

log_amplitude = log(1 + amplitude_spectrum);
gamma = 2;
display_amplitude = (log_amplitude / max(log_amplitude(:))) .^ gamma;

figure('Color', 'w', 'Position', [100 100 800 420]);
tiledlayout(1, 2);

nexttile();
imshow(img);
title('Gabor grid (16 patches)');
fontsize(14, 'points');

nexttile();
imagesc(display_amplitude);
colormap(gca, gray); clim([0 1]); axis image;
set(gca, 'YDir', 'normal');
% All the energy sits within highFreqRange(2) of DC -- zoom the display
% to that region instead of showing the mostly-empty full-size spectrum.
zoomR = highFreqRange(2) * 1.4;
xlim([cx-zoomR, cx+zoomR]);
ylim([cy-zoomR, cy+zoomR]);
title(sprintf('Amplitude spectrum (log, \\gamma=%g)', gamma));
fontsize(14, 'points');
colorbar;

exportgraphics(gcf, 'gabor_grid_16_spectrum.png', 'Resolution', 300);
fprintf('Saved gabor_grid_16_spectrum.png\n');
