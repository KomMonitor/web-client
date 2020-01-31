# KomMonitor WebClient User Guide

The objective of this guide is to give you the knowledge needed to extend KomMonitor with your own functions. The last chapter contains an example on how to add such a function. In this chapter the information given in all previous chapters is used.

**Table of Content**

- [KomMonitor Web Client User Guide](#kommonitor-web-client-user-guide)
    - [Folder Structure](#folder-structure)
    - [Project fundamental Libraries](#project-fundamental-libraries)
        - [Bootstrap](#bootstrap)
        - [AngularJS](#angularjs)
            - [MVC Pattern](#mvc-pattern)
            - [Angular Component Structure](#angular-component-structure)
            - [Working with AngularJS Services](#working-with-angularjs-services)
    - [Adding new Libraries](#adding-new-libraries)
    - [Adding new Functionalities](#adding-new-functionalities)


## Folder Structure

If you downloaded or cloned the Web Client the main folder contains the subfolders "app", "customizedExternalLibs", "documentation" and "misc" as well as some files. Most of these files are used in the building process. During the build process another folder named "node_modules" is created. This folder contains ...
Some third-party libraries had to be modified or extended. To differentiate them form unmodified libraries they are placed in a separate folder ("customizedExternalLibs"). The "app" folder is the most important folder, because it contains most of the source code.
The "app" folder contains the "components", "iconsFromPngTree", "logos", "util" and (after the build process) "dependencies" subfolders. You can also find the index.html app.css files here. The "index.html" file is the starting point of the application. It is mainly used to load all needed scripts. All CSS rules (besides very few inline CSS declarations) can be found in the "app.css" file. "env.js" (an abbreviation for "environment") is a configuration file for important variables. E.g. it contains the list of predefined WMS layers (window.__env.wmsDatasets), which could be edited if you wanted to add a specific WMS layer permanently.
The folders "logos" and "iconsFromPngTree" contain various images used in different locations of the Web Client. The data-exchange-service, an AngularJS service, can be found in the "util" folder.
All AngularJS components are located inside the "components" folder. For more information about AngularJS components in general see the [AngularJS section below](#AngularJS). The subfolder "kommonitorAdmin" refers to the administration panel and "kommonitorUserInterface" to the main application. The components are named and structured by their functionality. Some component names are preceded by the term "kommonitor", but there is no meaning in that.
Lets say you were looking for the source code of the reachability function. You can find the corresponding component "kommonitorReachability" inside the "kommonitorControls" folder.
For the main application the "kommonitor-user-interface" component defines the structural layout of the user interface. All other (sub-)components are referenced in this component. The component itself is referenced indirectly in the index.html file by the \<ng-view> tag. You could say that instead of the index.html file, this component defines the layout. For the admin interface the same applies for the "kommonitor-admin" component. 

## Fundamental Libraries

The KomMonitor web client uses many third-party libraries. While most of them are only used in specific parts of the application (e.g. [TableExport.js](https://github.com/clarketm/TableExport) to export html-tables as .xlsx, .csv or .txt files) there are a few libraries that are used heavily. These fundamental libraries also change the way the project is organized. It is therefore important to have a basic understanding of what they are used for and how they work.
The scope of this document is to give a short introduction. You can read about each library in detail by following the links at the end of each tutorial.

### Bootstrap

Bootstrap is a front end framework to develop responsive websites.

<b>Further reading</b>

### Leaflet

...

<b>Further reading</b>

### AngularJS

AngularJS is maybe the most important library used in the web client. It fundamentally changes the coding style and the folder structure.
Note that there is a difference between Angular and AngularJS. Essentially, AngularJS is an old but not compatible version of Angular. You can read more about the differences [in this blogpost](https://www.simplilearn.com/angularjs-vs-angular-2-vs-angular-4-differences-article).

AngularJS is a lightweight framework for 

#### MVC Pattern

MVC stands for Model View Controller. The MVC pattern is a commonly used software design pattern. Its main advantage is, that the application gets divided into three separate, but yet connected parts. This facilitates maintainability in complex applications.

<img src="./MVC-pattern.png" width="300" height="300" />

As shown in the diagram the view is the part visible to the user. This is the user interface. The View is only responsible for showing information, not the information itself. The user actions get passed to the controller. The controller (if necessary) updates the Model, which is the place where the data is stored. The Model contains only the data. In reverse, if the model changes it notifies the controller, who updates the view accordingly.
The controller is the connection/glue between the view and the model. There is no direct connection between View (user interface) and Model (Data).
<b>Example:</b> Let's say the User fills in a form and enters his name. The representation of the form is the view. The users input gets passed to the controller. Additional code, like validating the input would be placed in the controller. If the input is valid it gets stored in the model as a variable. Clicking a reset button in the form would delete the name from the model. The model notifies the controller about the change who removes the name from the view.

You can read more about the MVC pattern [here](http://researchhubs.com/post/computing/web-application/the-model-view-vontroller-design-pattern.html).

#### AngularJS Component Structure

An AngularJS component is

The AngularJS component structure reflects the MVC pattern. Although it is possible to define a component in a single file

TODO

You can read more about AngularJS components [here](https://docs.angularjs.org/guide/component).

#### Working with AngularJS Services

<b>Further reading</b>
[API Documentation](https://docs.angularjs.org/api)
[Official Tutorial](https://docs.angularjs.org/tutorial)
[FAQ](https://docs.angularjs.org/misc/faq)

## Adding new Libraries

## Adding new Functionalities
