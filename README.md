# Void Drifter

Void Drifter is a small top down space shooter I built entirely with plain HTML, CSS, and JavaScript.

There is no game engine behind it, no external libraries, no downloaded sprites, and no audio files. Everything you see and hear is created directly in the browser using the Canvas API and Web Audio API.

The main reason I made this was to see how far I could push a single HTML canvas and how much game feel I could get out of a fairly simple arcade shooter.



## How to Play

Your goal is to survive all 12 waves.

Each wave becomes a little faster and more difficult.
 Clear the final wave and you win. Lose all your lives and the run is over.

### Controls

* **W, A, S, D** or **Arrow Keys ** — Move
* **Spacebar  ** —   Shoot
* **Escape  ** —   Pause or resume
* **Enter  ** —  Start the game or restart after losing

## Score Multiplier

The scoring system rewards you for staying aggressive.

Every enemy you destroy adds to your current kill streak. 

Once you reach five consecutive kills without taking damage, your score multiplier increases.

The multiplier can climb as high as 5x, but getting hit resets it straight back to 1x.

It creates a nice high risk high reward situation. 
Playing carefully keeps you alive, but pushing forward and keeping your streak going earns much higher scores.

## Enemies

### Drones

The most basic enemy in the game.

They appear near the top of the screen and move straight downward. They are easy to deal with individually, but large groups can still become a problem.

### Weavers

Weavers move from side to side in a smooth wave pattern while travelling down the screen.

Their movement makes them harder to line up with, especially when other enemies are around.

### Turrets

Turrets are slower and tougher than the other enemies.

They move partway down the screen, stop, aim toward the player's position, and fire back. Standing still around them is usually a bad idea.

## Power ups

Destroyed enemies occasionally drop a power-up. Move over it before it leaves the screen to collect it.

### Shield

Marked with an **S**.

The shield creates a ring around the ship and blocks one hit. It protects you from either an enemy bullet or a direct collision.

Once it absorbs damage, it disappears.

### Rapid Fire

Marked with an **R**.

Rapid Fire reduces the delay between shots for 10 seconds, letting you fire much faster than normal.

### Wide Shot

Marked with a **W**.

Wide Shot changes the normal weapon into a three-direction spread for 10 seconds. It is especially useful when several enemies are entering the screen at once.

##

## Features

* 12  enemy waves
* Three enemy types
* Score and high score 
* Kill streak multiplier up to 5x ( stardance got better multiplier hahah )
* Three temporary power ups
*  explosions
* Screen flashes and hit feedback
*  sound effects
* Local high score saving
* Pause, victory, and game over screens
