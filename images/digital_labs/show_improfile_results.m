%
% SHOW_IMPROFILE_RESULTS
%
% Plots the four improfile signals with max/min reference lines.
%
% This is a SCRIPT, not a function - it expects the following variables
% to already exist in your workspace before you run it:
%
%   Ip_A, Ip_B, Ip_C, Ip_D                     - the four improfile vectors
%   Ip_A_max, Ip_A_min, Ip_B_max, Ip_B_min,    - the max/min pixel value
%   Ip_C_max, Ip_C_min, Ip_D_max, Ip_D_min       for each patch
%
% Optionally, set a variable called 'prefix' before running this script
% (e.g. prefix = 'sigma2';) to instead use the variables Ip_A_sigma2,
% Ip_B_sigma2, ..., Ip_A_max_sigma2, Ip_A_min_sigma2, etc. This lets you
% reuse the same script for different datasets (e.g. 'sigma2', 'sigma3')
% without renaming variables back to the plain Ip_A form each time.
%

% no suffix is added if prefix does not exist, or if it is '' or []
% (isempty() is true for both '' and [], so both are handled the same way)
if ~exist('prefix', 'var')
    prefix = '';
end
% force prefix to a char array. Handle numbers specially: char(2) does
% NOT give the text '2', it gives an unprintable control character (char
% treats a number as a character CODE, not as text to display) - use
% num2str for numeric prefixes so prefix = 2 behaves like prefix = '2'.
% For string/char input, char() normalizes "2" (string) the same way as
% '2' (char), avoiding the multi-element string array that ['_' prefix]
% would otherwise silently produce.
if isnumeric(prefix)
    prefix = num2str(prefix);
else
    prefix = char(prefix);
end
if isempty(prefix)
    suffix = '';
else
    suffix = ['_' prefix];
end

% check that everything needed is already in the workspace
base_names = {'Ip_A', 'Ip_B', 'Ip_C', 'Ip_D', ...
    'Ip_A_max', 'Ip_A_min', 'Ip_B_max', 'Ip_B_min', ...
    'Ip_C_max', 'Ip_C_min', 'Ip_D_max', 'Ip_D_min'};

missing_vars = {};
for k = 1:numel(base_names)
    full_name = [base_names{k} suffix];
    if ~exist(full_name, 'var')
        missing_vars{end+1} = full_name; %#ok<AGROW>
    end
end

if ~isempty(missing_vars)
    error('show_improfile_results:missingVariables', ...
        'Missing variable(s) in the workspace: %s', strjoin(missing_vars, ', '));
end

% pull the (possibly suffixed) variables into the plain local names used
% by the rest of this script
for k = 1:numel(base_names)
    full_name = [base_names{k} suffix];
    eval([base_names{k} ' = ' full_name ';']);
end

profiles = {Ip_A, Ip_B, Ip_C, Ip_D};
maxvals = [Ip_A_max, Ip_B_max, Ip_C_max, Ip_D_max];
minvals = [Ip_A_min, Ip_B_min, Ip_C_min, Ip_D_min];
labels = {'A', 'B', 'C', 'D'};

% display parameters for converting pixel value to luminance - use
% existing workspace values if already defined, otherwise fall back to
% sensible defaults
if ~exist('a_0', 'var')
    a_0 = 120;
end
if ~exist('Imax', 'var')
    Imax = 2^8 - 1;
end
if ~exist('gamma', 'var')
    gamma = 2.2;
end

fprintf('Using a_0 = %g, Imax = %g, gamma = %g - check these match your display.\n', ...
    a_0, Imax, gamma);

bit_depth = log2(Imax + 1);

figure;
tiledlayout(2, 2);

for i = 1:4
    contrast = calculate_michelson_contrast(maxvals(i), minvals(i), a_0, gamma, bit_depth);

    L_profile = a_0 * (double(profiles{i}) / Imax) .^ gamma;
    L_max = a_0 * (maxvals(i) / Imax)^gamma;
    L_min = a_0 * (minvals(i) / Imax)^gamma;

    ax = nexttile;

    yyaxis(ax, 'left');
    plot(ax, L_profile);
    ylim(ax, [0, a_0]);
    ylabel(ax, 'Luminance (cd/m^2)');
    yline(ax, L_max, 'r', 'LineWidth', 1.5);
    yline(ax, L_min, 'r', 'LineWidth', 1.5);

    % right axis shares the same underlying luminance scale as the left
    % axis, but its ticks are placed and labelled at the pixel-intensity
    % values that map (non-linearly, via gamma) onto those luminances
    tick_pixels = [0, 32, 64, 96, 128, 160, 192, 224, Imax];
    tick_luminance = a_0 * (tick_pixels / Imax) .^ gamma;

    yyaxis(ax, 'right');
    ylim(ax, [0, a_0]);
    ax.YTick = tick_luminance;
    ax.YTickLabel = string(tick_pixels);
    ylabel(ax, 'Pixel intensity');

    xlim(ax, [1, numel(profiles{i})]);
    if i >= 3
        xlabel(ax, 'Pixels');
    end
    title(ax, sprintf('Patch %s (contrast = %.3f)', labels{i}, contrast));
end
