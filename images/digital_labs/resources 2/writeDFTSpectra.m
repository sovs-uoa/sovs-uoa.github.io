function writeDFTSpectra(amplitude, phase, options)
% WRITEDFTSPECTRA  Save amplitude and phase spectra to PNG files, with
% axes labelled in cycles/image.
%   writeDFTSpectra(amplitude, phase) saves 'dft_spectrum_amplitude.png'
%   and 'dft_spectrum_phase.png' in the current folder.
%   writeDFTSpectra(amplitude, phase, label='cameraman') saves
%   'cameraman_amplitude.png' and 'cameraman_phase.png' instead.
arguments
    amplitude (:,:) double
    phase (:,:) double
    options.label (1,:) char = 'dft_spectrum'
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

figAmp = figure('Color', 'w', 'Visible', 'off');
imagesc(fx, fy, displayAmplitude);
colormap(gca, gray); clim([0 1]); axis image;
set(gca, 'YDir', 'normal');
xlabel('cycles/img'); ylabel('cycles/img');
title('Amplitude spectrum (log)');
colorbar;
exportgraphics(figAmp, amplitudeFile, 'Resolution', 300);
close(figAmp);

figPhase = figure('Color', 'w', 'Visible', 'off');
imagesc(fx, fy, phase);
colormap(gca, gray); axis image;
set(gca, 'YDir', 'normal');
xlabel('cycles/img'); ylabel('cycles/img');
title('Phase spectrum');
colorbar;
exportgraphics(figPhase, phaseFile, 'Resolution', 300);
close(figPhase);

fprintf('Saved %s and %s\n', amplitudeFile, phaseFile);

end
