# BeatAi

Within the beatai.it site you will see my project in operation, you can do a couple of things but the main part is to be able to understand what an artificial intelligence can do! In particular we are talking about Deep Learning using the neat algorithm (NeuralEvolution of Augmenting Topologies).

## Create Level

It all starts with the possibility of creating a 2D level, where it is possible to place obstacles such as walls or balls that can bounce from one part of the screen to the other. Obviously it is to choose the starting position of the player by placing him on the map and also to choose the position that he must reach with the end object.

![Imgur Image](http://i.imgur.com/b5yFwlQ.png)


## Play Level

After creating the level you can play it thanks to the directional arrows to test its difficulty and if it is actually a feasible level. Within this section it is also possible to see how many attempts it took to complete the level.

## AI Play Level 

Obviously the central part is just this, putting your level under the test of an AI, using a neat algorithm you will be able to see the various populations that will try to finish your level by being able to select some characteristics of the AI, such as the size of each population and the type of learning, whether incremental or not.
The peculiarity of this project is that here you will be able to see the evolution of an artificial intelligence completely empty and without initial information, so each level will be like seeing a child trying and trying to do something over time, understanding what it has to do over time.

Before each choice of movement the artificial intelligence will have as input 12 information, its position and that of the end in polar coordinates (x, y) also the distance to the nearest obstacle in the directions: above, below, right, left and the four diagonals3