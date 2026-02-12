#!/bin/bash

# Make sure that a file path has been passed as an argument
if [ "$#" -ne 1 ]; then
    echo "Please specify the path to the text file."
    exit 1
fi

# Read the text file line-by-line
while IFS= read -r line; do
    # Check that the folder exists
    if [ -d "$line" ]; then
        # Delete the directory and its contents
        rm -rf "$line"
        echo "Directory $line has been deleted."
    else
        echo "Directory $line not found."
    fi
done < "$1"
