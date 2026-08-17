% generate_gabor_grid.m
%
% A 4x4 grid of 16 Gabor patches for a frequency-domain filtering lab:
% 8 patches carry a LOW spatial frequency, 8 carry a HIGH spatial
% frequency, with a deliberate GAP between the two bands and grid
% position shuffled randomly. A single well-chosen Gaussian/Butterworth
% low-pass or high-pass cutoff placed in that gap should then cleanly
% "zap" one whole group while leaving the other clearly visible.
%
% Why the gap matters: a small, spatially-localized patch is not a
% single point in frequency space -- it is a small Gaussian BLOB
% centred on its carrier frequency, with spread ~ 1/(2*pi*sigma) (the
% same time-frequency uncertainty tradeoff as Lecture 7's "uncertainty
% principle" slide). If the two bands were placed right up against the
% cutoff with no gap, patches near the boundary would only be
% partially attenuated instead of cleanly kept-or-zapped.

clear; close all; rng(1);   % fixed seed -> reproducible lab handout

%% Parameters
tileSize   = 80;              % pixels per patch
gridN      = 4;                % 4x4 grid
N          = tileSize*gridN;   % full image size (320 x 320)
sigma      = 14;               % Gaussian envelope std (pixels)
amplitude  = 0.42;              % contrast of the sinusoid around mid-grey
background = 0.5;

lowFreqRange  = [4  9];        % cyc/image
highFreqRange = [28 45];       % cyc/image -- gap (9 to 28) keeps every
                                % patch's spectral blob well clear of a
                                % cutoff placed in the middle of it

%% Assign each of the 16 grid cells to a group, then shuffle positions
nPatches = gridN*gridN;
isLow = [true(1, nPatches/2), false(1, nPatches/2)];
isLow = isLow(randperm(nPatches));

freqs   = zeros(1, nPatches);
orients = pi*rand(1, nPatches);      % 0..180 deg
phases  = 2*pi*rand(1, nPatches);

for k = 1:nPatches
    if isLow(k)
        freqs(k) = lowFreqRange(1) + diff(lowFreqRange)*rand();
    else
        freqs(k) = highFreqRange(1) + diff(highFreqRange)*rand();
    end
end

%% Render
img = background * ones(N, N);
[xx, yy] = meshgrid(1:tileSize, 1:tileSize);
cx = tileSize/2; cy = tileSize/2;

k = 0;
for row = 1:gridN
    for col = 1:gridN
        k = k + 1;
        xr = (xx-cx)*cos(orients(k)) + (yy-cy)*sin(orients(k));
        envelope = exp(-((xx-cx).^2 + (yy-cy).^2) / (2*sigma^2));
        carrier  = cos(2*pi*(freqs(k)/N)*xr + phases(k));
        patch = amplitude * envelope .* carrier;

        rowIdx = (row-1)*tileSize + (1:tileSize);
        colIdx = (col-1)*tileSize + (1:tileSize);
        img(rowIdx, colIdx) = img(rowIdx, colIdx) + patch;
    end
end

img = min(max(img, 0), 1);

%% Save the lab image
imwrite(img, 'gabor_grid_16.png');

% Ground truth (which grid cells are low/high) for YOUR reference when
% checking student results -- not meant to be handed out.
gridIsLow = reshape(isLow, gridN, gridN)';
save('gabor_grid_16_truth.mat', 'gridIsLow', 'freqs', 'orients', 'phases', ...
     'lowFreqRange', 'highFreqRange', 'tileSize', 'gridN', 'sigma', 'background');

%% Preview
figure('Color', 'w');
imshow(img);
title('16 Gabor patches (8 low-freq, 8 high-freq, shuffled)');
exportgraphics(gcf, 'gabor_grid_16_preview.png', 'Resolution', 300);

fprintf('Saved gabor_grid_16.png (%dx%d) and gabor_grid_16_truth.mat\n', N, N);
