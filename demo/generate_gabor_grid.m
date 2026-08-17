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
% spaceScale grows the tile (and canvas) while sigma stays fixed in
% pixels, so each patch keeps its current size but sits in a bigger
% cell -- i.e. more empty gutter between neighbouring patches. The
% frequency ranges are scaled by the same factor so cyc/pixel (how
% fine the stripes actually look) is unchanged -- only the gutter grows.
spaceScale = 1.5;

tileSize   = round(80*spaceScale);   % pixels per patch cell
gridN      = 4;                % 4x4 grid
N          = tileSize*gridN;   % full image size
sigma      = 14;               % Gaussian envelope std (pixels) -- fixed,
                                % so patches themselves do not grow
amplitude  = 0.42;              % contrast of the sinusoid around mid-grey
background = 0.5;

% Both bands are pushed well away from DC: at sigma=14px each patch's
% spectral blob has radius ~9-11 cyc/image, so 8 orientations packed
% into a ring near DC (as when the low band sat at 4-9 cyc/image)
% overlap into one indistinguishable, interference-fringed blob. Out
% here the ring circumference is large enough that all 8 blobs in a
% band stay visually separated.
lowFreqRange  = [28 40]  * spaceScale;   % cyc/image
highFreqRange = [65 90]  * spaceScale;   % cyc/image -- gap keeps every
                                % patch's spectral blob well clear of a
                                % cutoff placed in the middle of it

%% Assign each of the 16 grid cells to a group, then shuffle positions
nPatches = gridN*gridN;
nPerBand = nPatches/2;
isLow = [true(1, nPerBand), false(1, nPerBand)];
isLow = isLow(randperm(nPatches));

% A real-valued grating at orientation theta produces TWO mirrored
% blobs in the spectrum, at theta and theta+180deg. Evenly spacing each
% band's nPerBand orientations across 0..180deg (with a random phase
% offset, then a random per-patch assignment) therefore places all
% 2*nPerBand blobs of that band evenly around the full circle, instead
% of risking two random orientations landing close together and their
% blobs merging.
lowOrients  = mod(rand()*pi/nPerBand + (0:nPerBand-1)*(pi/nPerBand), pi);
highOrients = mod(rand()*pi/nPerBand + (0:nPerBand-1)*(pi/nPerBand), pi);
lowOrients  = lowOrients(randperm(nPerBand));
highOrients = highOrients(randperm(nPerBand));

freqs   = zeros(1, nPatches);
orients = zeros(1, nPatches);
phases  = 2*pi*rand(1, nPatches);

iLow = 0; iHigh = 0;
for k = 1:nPatches
    if isLow(k)
        iLow = iLow + 1;
        freqs(k)   = lowFreqRange(1) + diff(lowFreqRange)*rand();
        orients(k) = lowOrients(iLow);
    else
        iHigh = iHigh + 1;
        freqs(k)   = highFreqRange(1) + diff(highFreqRange)*rand();
        orients(k) = highOrients(iHigh);
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
