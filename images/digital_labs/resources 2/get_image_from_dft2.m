function I = get_image_from_dft2 (f)

% GET_IMAGE_FROM_DFT2 Return the zero-centered 2D DFT to spatial domain
%
%
%   I_gray = get_image_from_dft2 (f)
%
% where 
%       I_gray  is the outputn grayscale image 
%       f       is the original complex DFT2 
%
% EXAMPLE 
%
% 
%  %% Example usage 
%
%  sigma = 20; % standard deviation 
%
%  % Load and create DFT2
%  I = imread ('cameraman.tif');
%  I_gray = im2gray (double(I));
%  dft2  = get_centered_dft2 (I_gray);
%
%  % Create a gaussian mask with std. dev
%  % Then multiply the mask with the DFT
%  low_pass_mask = fspecial('gaussian',size(I),sigma); % get a gaussian mask 
%  low_pass_mask = low_pass_mask./ max(low_pass_mask,[],"all");       % maximum value = 1 
%  dft2_low_filt = dft2.*low_pass_mask;
%  amplitude_filtered = abs (dft2_low_filt);
%
%
%  % Return the result to the spatial domain 
%  I_output = get_image_from_dft2 (dft2_low_filt);
%
%  figure; clf;
%  tiledlayout (1,4)
%
%  nexttile(); % original image 
%  imshow (I); 
%  title ('Original');
%
%  nexttile(); 
%  imshow (low_pass_mask); 
%  title ('Low-pass Mask');
%
%  nexttile(); % filtered amplitude  
%  imagesc (log(1+amplitude_filtered)); 
%  colormap gray;
%  title ('Filtered Amplitude');
%  axis square;
 %
%  nexttile(); % phase 
%  imshow (I_output);
%  title ('Filtered Image');
% 

I = ifft2(fftshift(f)); 
I = mat2gray(abs(I));
end
