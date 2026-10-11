function writeDFTSpectra(amplitude, phase, options)
% WRITEDFTSPECTRA  Save amplitude and phase spectra to PNG files, with
% axes labelled in cycles/image.
%   writeDFTSpectra(amplitude, phase) saves 'dft_spectrum_amplitude.png'
%   and 'dft_spectrum_phase.png' in the current folder.
%   writeDFTSpectra(amplitude, phase, label='cameraman') saves
%   'cameraman_amplitude.png' and 'cameraman_phase.png' instead.
%   writeDFTSpectra(amplitude, phase, cutoff=8) additionally overlays a
%   dashed circle of radius cutoff (in cycles/image) centred on DC, on
%   both saved spectra -- e.g. to mark a Butterworth cutoff frequency
%   you have chosen.
arguments
    amplitude (:,:) double
    phase (:,:) double
    options.label (1,:) char = 'dft_spectrum'
    options.cutoff (1,1) double = 0
end

gamma = 2;
logAmplitude = log(1 + amplitude);
displayAmplitude = (logAmplitude / max(logAmplitude(:))) .^ gamma;

% amplitude/phase are already fftshifted (DC at the centre), so index
% (row,col) corresponds to a frequency of (row,col) - centre in
% cycles/image -- build that axis so the saved plots read directly in
% those units instead of raw array indices.
[rows, cols] = size(amplitude);
fx = -floor(cols/2) : (ceil(cols/2)-1);
fy = -floor(rows/2) : (ceil(rows/2)-1);

amplitudeFile = sprintf('%s_amplitude.png', options.label);
phaseFile     = sprintf('%s_phase.png', options.label);

% Cutoff ring, if requested -- drawn in data units (cycles/image) so it
% overlays correctly regardless of image size.
showRing = options.cutoff > 0;
if showRing
    theta = linspace(0, 2*pi, 200);
    ringX = options.cutoff * cos(theta);
    ringY = options.cutoff * sin(theta);
end

figAmp = figure('Color', 'w', 'Visible', 'off');
imagesc(fx, fy, displayAmplitude);
colormap(gca, gray); clim([0 1]); axis image;
set(gca, 'YDir', 'normal');
xlabel('cycles/img'); ylabel('cycles/img');
title('Amplitude spectrum (log)');
colorbar;
if showRing
    hold on;
    plot(ringX, ringY, 'r--', 'LineWidth', 1.5);
    hold off;
end
exportgraphics(figAmp, amplitudeFile, 'Resolution', 300);
close(figAmp);

figPhase = figure('Color', 'w', 'Visible', 'off');
imagesc(fx, fy, phase);
colormap(gca, gray); axis image;
set(gca, 'YDir', 'normal');
xlabel('cycles/img'); ylabel('cycles/img');
title('Phase spectrum');
colorbar;
if showRing
    hold on;
    plot(ringX, ringY, 'r--', 'LineWidth', 1.5);
    hold off;
end
exportgraphics(figPhase, phaseFile, 'Resolution', 300);
close(figPhase);

fprintf('Saved %s and %s\n', amplitudeFile, phaseFile);

end
