# Suspense, and the Expectation of Future Learning

Replication of work by Li, Bramley, & Gureckis (2021). This repo contains both the modelling code and the web app that replicates the study.

The game has been created using *Psychex*.

# Modelling

The modelling code can be found in `simulations/li_bramley_gureckis.ipynb`. See the inline markdown for more details.

# Blackjack-Game

To run the game - which is a modified blackjack-style game - navigate to src/ from a terminal and spin up a local server. This can be done with any of the following commands:

With Python:

    ```
    # Python

    python -m http.server

    # Alternatively

    python3 -m http.server
    ```

With Node:

    ```
    // Node.js

    npm install http-server -g
    http-server -p 8000
    ```

Or php:

    ```
    // php

    php -S 0.0.0.0:8000
    ```

The game-type can be specified with the URL param `mode`. There are 2 options:
- ?mode=0 : the low-suspense mode, sampled from the bottom 10% of suspense scores
- ?mode=1 : the high-suspense mode, sampled from the top 5% of suspense scores

Thus the game can be opened through a browser, by navigating to `http://127.0.0.1:8000/?mode=X`, replacing `X` with either `0` or `1`.

# References

Li, Z. W., Bramley, N. R., & Gureckis, T. M. (2021). Expectations about future learning influence moment-to-moment feelings of suspense. Cognition and Emotion, 35(6), 1099-1120.