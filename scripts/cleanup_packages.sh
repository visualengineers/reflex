#!/bin/bash

# Stelle sicher, dass ein Dateipfad als Argument übergeben wurde
if [ "$#" -ne 1 ]; then
    echo "Bitte gib den Pfad zur Textdatei an."
    exit 1
fi

# Lies die Textdatei zeilenweise
while IFS= read -r line; do
    # Überprüfe, ob der Ordner existiert
    if [ -d "$line" ]; then
        # Lösche den Ordner und seinen Inhalt
        rm -rf "$line"
        echo "Ordner $line wurde gelöscht."
    else
        echo "Ordner $line existiert nicht."
    fi
done < "$1"
