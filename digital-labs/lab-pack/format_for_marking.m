function format_for_marking (A) 

% FORMAT_FOR_MARKING Convert a matrix into a flattened format. 
% This will be suitable for marking purposes 
%
%  format_for_marking (A) 
%
% where 
%       A is a matrix 
%
% returns a flattened string that is pasted into Canvas 
%
% EXAMPLE 
%
% A = randi(3,3); B = randi(3,3); 
% format_for_marking(A+B)  %<-- paste result into output field
% 


disp(mat2str(A));

end 