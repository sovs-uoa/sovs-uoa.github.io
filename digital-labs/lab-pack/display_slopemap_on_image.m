function display_slopemap_on_image(I, gR1)
%DISPLAY_SLOPEMAP_ON_IMAGE Show original image, red/green slope map, and unsharp overlay.
%
%   display_slopemap_on_image(I, gR1) where I is the original image
%   (RGB or grayscale) and gR1 is the signed Prewitt gradient computed
%   from I, e.g.
%       I16 = int16(rgb2gray(I));
%       gR1 = imfilter(I16, s1, 'replicate');

    I_gray = I;
    if size(I_gray,3) == 3
        I_gray = rgb2gray(I_gray);
    end
    base_uint8 = double(I_gray(:,:,1));

    gR1_2d = gR1(:,:,1);
    amount = 1.5;
    gamma = 0.5;   % <1 stretches red/green so moderate slopes look more obvious

    slopeRGB = redGreenSlope(gR1_2d, gamma);
    finalMap = addDetail(base_uint8, slopeRGB, amount);

    maxAbs = max(abs(double(gR1_2d(:))));

    figure;
    tiledlayout(1,3);

    nexttile;
    imshow(uint8(base_uint8));
    title('Original');

    ax = nexttile;
    imagesc(ax, double(gR1_2d));
    axis(ax, 'image', 'off');
    colormap(ax, redGreenColormap(256, gamma));
    clim(ax, [-maxAbs maxAbs]);   % center the colormap at zero
    cb = colorbar(ax);
    cb.Label.String = 'Slope (raw Prewitt gradient value)';
    title(ax, 'Slope map (red = falling, green = rising)');

    nexttile;
    imshow(finalMap);
    title('Unsharp map (red/green)');
end

function detailRGB = redGreenSlope(gradient2D, gamma)
    % Single shared scale (not independently stretched per channel), so
    % red and green saturation correspond to a true continuum of the
    % same underlying gradient magnitude.
    maxAbs = max(abs(double(gradient2D(:))));
    normVal = double(gradient2D) / maxAbs;   % range -1 (max falling) to +1 (max rising)

    pos = normVal;
    pos(pos < 0) = 0;

    neg = -normVal;
    neg(neg < 0) = 0;

    % power-law stretch: gamma < 1 boosts moderate values so color becomes
    % visibly saturated well before reaching the true maximum magnitude
    pos = pos .^ gamma;
    neg = neg .^ gamma;

    R = neg * 255;   % falling slope -> red
    G = pos * 255;   % rising slope -> green
    B = zeros(size(gradient2D));

    detailRGB = cat(3, R, G, B);
end

function cmap = redGreenColormap(n, gamma)
    % Diverging colormap: red (bottom) -> black (middle) -> green (top),
    % with the same gamma stretch applied so the colorbar panel matches
    % the saturation seen in the blended final image.
    if nargin < 2
        gamma = 1;
    end
    if nargin < 1
        n = 256;
    end

    t = linspace(-1, 1, n)';
    sat = abs(t) .^ gamma;

    R = zeros(n, 1);
    G = zeros(n, 1);
    B = zeros(n, 1);

    R(t < 0) = sat(t < 0);
    G(t > 0) = sat(t > 0);

    cmap = [R G B];
end

function finalImg = addDetail(baseImg, detailImg, amount)
    % Classic unsharp-mask addition: final = base + amount*detail, clipped
    % to the valid 0-255 range.
    base = double(baseImg);
    detail = double(detailImg);

    if size(detail,3) == 3 && size(base,3) == 1
        base = repmat(base, 1, 1, 3);
    end

    combined = base + amount .* detail;
    combined = min(max(combined, 0), 255);
    finalImg = uint8(combined);
end
