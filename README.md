# SOVS-UOA optics bench 

This program is a ray-tracer developed as part of the OPTOM263 Essential optics course that runs in the School of Optometry and Vision Science (SOVS) at the University of Auckland (UOA). 

The program is an interactive ray-tracer for performing simple paraxial ray-tracing.  It is intended to allow students to  learn key concepts of paraxial optics in an interactive and user-friendly way.  

There are many great tools for performing ray-tracing. Unfortunately commercial tools can be expensive, not suitable for using interactively, and they may require a significant learning curve to understand. There are also a number of great optics demonstrations out there, but they tend to be qualitative, or require modification to make it useful.

This application attempts to bridge the gap between the two. It is interactive, obeys the conventions standard in optometry, and gives enough information to confirm the relationships that one comes across when studying optics.

## Getting Started:

The application is accessed using the link: http://sovs-uoa.github.io. As of the time of this writing, the link will take you to a page written for the OPTOM263 course, and you can click on Lab2 for example to start the system. 

The application is written in Javascript/HTML5 but has only be tested using Chrome. Hopefully the compatibility with outher browsers will be extended in the future. It is likely broken in other web-browsers. 

The program takes as input a .lens prescription file (some of which are "canned") already and displays the lens prescription and details of the system.  Rays can be traced through the system as well.


## Instructions [to be written]

Object and Image prescription 
-----------------------------

1 - Object and Image (with respect to the lens surface)
2 - Two focal points and nodals points (with respect to the lens)
3 - Have a cartesian frame of reference (incoming light to left)
3 - If Object rays are:  

	converging - i.e., object distance is positive - object point to lens virtual (dotted) 
	diverging  - i.e., object distance is negative - object point to lens real    (solid)

4 - If Image rays are: 

	converging - i.e., image distance is positive - object point to lens real (solid) 
	diverging  - i.e., image distance is negative - object point to lens virtual (dotted)

5 - Rays to the focal points and rays to the nodal points 
6 - Cardinal points 

Rays
----

1 - Individual ray 

		- type  = cardinal ray 
		- starts @ object 
			- ray 1: horizontal ray to p2 to f2 to image  

				Create a thin-equivalent system at F, P2, n1, n2
				Trace ray through it (Build from the Ray Rules)

			- ray 2: ray to n1 to n2 to image  
			- ray 3: ray through f1 to p1 to image 		

				Create a thin-equivalent system at F, P1, n1, n2
				Trace ray aimed at it (Build from the Ray Rules)

Rules for rays:

		If image is to left of element (e.g., p2) :
				- virtual traceback from element (e.g., p2)
				- real to infinity (if last element / total )

				note: ray ends at image 

		If image is to right of system :
				- real traceforward from p2
				- real to infinity (if last element)

				note: ray ends at image 


RAYS 


rayType = "AIMED"
rayPoint = "nodal" / ""



## Getting Started

These instructions will get you a copy of the project up and running on your local machine for development and testing purposes. See deployment for notes on how to deploy the project on a live system.
Download the repository to your computer.  Place the downloaded repository into a directory seen by a web-server (for example Apache). Navigate to the web address using your browser and you should get a working version of the application.

### Prerequisites and installing

You will need a working web-server with the ability to add new web-applications. 
The repository should contain enough by itself to get the applciation working. 

## Running the tests

Explain how to run the automated tests for this system

## Deployment

Add additional notes about how to deploy this on a live system

## Built With

* [Bootstrap] 
* [JQuery]
* Javascript and HTML5

## Contributing

Please read [CONTRIBUTING.md](https://gist.github.com/PurpleBooth/b24679402957c63ec426) for details on our code of conduct, and the process for submitting pull requests to us.

## Authors

* **Jason Turuwhenua** - *Initial work* - [jtur044](https://github.com/jtur044)

See also the list of [contributors](https://github.com/your/project/contributors) who participated in this project.

## License

This project is licensed under the MIT License - see the [LICENSE.md](LICENSE.md) file for details

## Acknowledgments

* Hat tip to anyone who's code was used
* Inspiration
* etc
