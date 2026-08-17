% generate_butterworth_montage.m
%
% 2-row x 4-column montage of 2D Butterworth transfer functions
% H(r) = 1 / (1 + (r/R0)^(2n)), zero-centred, DC at the middle.
%
% Top row:    n = 1, 2, 3, 4    (low-pass -- full pass at DC, sharper
%                                 cutoff as n increases)
% Bottom row: n = -1, -2, -3,-4 (high-pass -- negative n inverts the
%                                 transfer function, per Lecture 7's
%                                 Butterworth definition)
%
% Every order crosses exactly H = 0.5 at r = R0 (verified numerically
% beforehand, including the DC pixel: 0^(2n) is 0 for n>0 and Inf for
% n<0 under ordinary IEEE arithmetic, giving H(0)=1 resp. H(0)=0
% automatically, no special-casing required).

clear; close all;

%% Parameters
N  = 200;   % grid resolution (pixels per side)
R0 = 30;    % nominal cutoff frequency (cyc/image), same for every panel
orders = [1 2 3 4 -1 -2 -3 -4];
tickFS = 7; titleFS = 9; cbFS = 8;

[u, v] = meshgrid(-N/2:N/2-1, -N/2:N/2-1);
r = sqrt(u.^2 + v.^2);

%% Plot
figure('Color', 'w', 'Position', [80 80 1150 620]);
tl = tiledlayout(2, 4, 'TileSpacing', 'compact', 'Padding', 'compact');

for k = 1:numel(orders)
    n = orders(k);
    H = 1 ./ (1 + (r ./ R0) .^ (2*n));

    nexttile;
    imagesc(H); axis image; colormap(gray); clim([0 1]);
    set(gca, 'YDir', 'normal', 'XTick', [], 'YTick', []);  % +f_y up (unused here, kept for consistency)
    title(sprintf('n = %d', n), 'FontSize', titleFS);

    % dashed circle at the R0 half-power cutoff, same on every panel
    hold on;
    th = linspace(0, 2*pi, 100);
    plot(N/2 + R0*cos(th), N/2 + R0*sin(th), 'r--', 'LineWidth', 1);
end

cb = colorbar;
cb.Layout.Tile = 'east';
cb.FontSize = tickFS;
cb.Label.String = 'H (mask magnitude, 0 to 1)';
cb.Label.FontSize = cbFS;

title(tl, { ...
    'Butterworth transfer function H = 1 / (1 + (r/R_0)^{2n}),  R_0 = 30', ...
    'top: low-pass (n > 0)   |   bottom: high-pass (n < 0)   |   dashed circle = R_0 (H = 0.5)' ...
    }, 'FontSize', titleFS + 1);

exportgraphics(gcf, 'butterworth_montage.png', 'Resolution', 300);
