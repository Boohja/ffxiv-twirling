import os
import json

# Define the path to the top-level folder
root_path = "."

# Iterate over each folder and file in the root path
for foldername, subfolders, filenames in os.walk(root_path):

    # Create an empty list to store the icon dictionaries
    icons = []

    # Iterate over each file in the folder
    for filename in filenames:

        # If the file has a ".png" extension, add it to the icons list
        if filename.endswith(".png"):

            # Create a dictionary with the icon filename and name
            icon_dict = {"icon": os.path.join(foldername, filename).replace("\\", "/").replace("./",""), "name": filename.replace(".png", "").replace("_", " ").title()}

            # Add the dictionary to the icons list
            icons.append(icon_dict)

    # If there are any icons in the folder, create a JSON file for the folder
    if len(icons) > 0:

        # Define the filename for the JSON file
        json_filename = foldername + ".json"

        # Write the icons list to a JSON file
        # print(icons)
        with open(json_filename, "w") as outfile:
            json.dump(icons, outfile)