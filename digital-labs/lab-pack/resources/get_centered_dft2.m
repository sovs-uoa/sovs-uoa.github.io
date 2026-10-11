function [f, a, p] = get_centered_dft2 (I_gray)

% GET_CENTERED_DFT2 Return the zero-centered 2D DFT of an grayscale image I
%
%
%   [f, a, p] = get_centered_dft2 (I)
%
% where 
%       I_gray  is the input grayscale image 
%       f       is the original complex DFT2 
%       a       is the amplitude spectrum 
%       p       is the phase spectrum 
%
% EXAMPLE 
%
% 
%  %% Example usage 
%  I = imread ('cameraman.tif');
%  I_gray = im2gray (I);
%  [f, a, p] = get_centered_dft2 (I);
%
%  figure; clf;
%  tiledlayout (1,3)
%
%  nexttile(); % amplitude 
%  imshow (I_gray);
%  title ('Amplitude');
%  fontsize(24,'points');
%
%  nexttile(); % amplitude 
%  imagesc (log(1 + amplitude_spectrum));
%  colormap gray;
%  title ('Amplitude');
%  fontsize(24,'points');
%  axis square;
%
%  nexttile(); % phase 
%  imagesc (phase_spectrum);
%  colormap gray;
%  title ('Phase');
%  fontsize(24,'points');
%  axis square;
% 

f = fft2 (double(I_gray));
f = fftshift(f); % shift the FFT so the DC component is at the center 
a = abs (f);
p = angle (f);

end
