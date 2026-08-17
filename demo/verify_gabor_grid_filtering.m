% verify_gabor_grid_filtering.m
%
% Sanity-check for generate_gabor_grid.m's lab image: applies a
% Butterworth low-pass and high-pass filter at a cutoff placed in the
% gap between the two frequency bands, then measures each patch's own
% local contrast before/after to confirm the low-pass keeps the LOW
% group and zaps the HIGH group (and vice versa for high-pass) --
% run this yourself before handing the image to students.

clear; close all;

load('gabor_grid_16_truth.mat');
img = im2double(imread('gabor_grid_16.png'));
N = size(img, 1);

D0 = mean([lowFreqRange(2), highFreqRange(1)]);  % midpoint of the gap
order = 4;

[xx, yy] = meshgrid(0:N-1, 0:N-1);
cx = N/2; cy = N/2;
D = hypot(xx-cx, yy-cy);
lowPassMask  = 1 ./ (1 + (D/D0).^(2*order));
highPassMask = 1 - lowPassMask;

F = fftshift(fft2(img));
imgLow  = real(ifft2(ifftshift(F .* lowPassMask)));
imgHigh = real(ifft2(ifftshift(F .* highPassMask)));

%% Quantify each patch's local contrast before/after
fprintf('%-5s %-5s %-6s %-10s %-10s  result\n', 'row', 'col', 'group', 'low std', 'high std');
correctLow = 0; correctHigh = 0;
k = 0;
for row = 1:gridN
    for col = 1:gridN
        k = k + 1;
        rowIdx = (row-1)*tileSize + (1:tileSize);
        colIdx = (col-1)*tileSize + (1:tileSize);
        tileLow  = imgLow(rowIdx, colIdx);
        tileHigh = imgHigh(rowIdx, colIdx);
        cLow  = std(tileLow(:));
        cHigh = std(tileHigh(:));

        if gridIsLow(row,col)
            grp = 'LOW'; ok = cLow > cHigh;
            correctLow = correctLow + ok;
        else
            grp = 'HIGH'; ok = cHigh > cLow;
            correctHigh = correctHigh + ok;
        end
        okStr = 'ok'; if ~ok, okStr = 'MISMATCH'; end
        fprintf('%-5d %-5d %-6s %-10.4f %-10.4f  %s\n', row, col, grp, cLow, cHigh, okStr);
    end
end
fprintf('\nLow-freq patches correctly dominant under LOW-PASS:  %d/8\n', correctLow);
fprintf('High-freq patches correctly dominant under HIGH-PASS: %d/8\n', correctHigh);

%% Display
% High-pass removes DC, so imgHigh has ~zero mean -- displaying it as-is
% clips the (near-zero, often slightly negative) background to black.
% Adding the background level back is purely a DISPLAY choice (does not
% change imgHigh itself): it recentres "no signal" on mid-grey instead
% of black, matching how filtered results are conventionally shown.
background = 0.5;   % matches generate_gabor_grid.m's background level (not saved to the .mat file)
imgHighDisplay = min(max(imgHigh + background, 0), 1);

figure('Color', 'w', 'Position', [100 100 1200 420]);
tiledlayout(1, 3);
nexttile(); imshow(img); title('Original (16 patches)');
nexttile(); imshow(imgLow); title(sprintf('Low-pass, D_0=%.0f', D0));
nexttile(); imshow(imgHighDisplay); title(sprintf('High-pass, D_0=%.0f (mid-grey = 0)', D0));
exportgraphics(gcf, 'gabor_grid_16_filtered_check.png', 'Resolution', 300);
