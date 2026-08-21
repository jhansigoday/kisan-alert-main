import os

filepath = 'requirements.txt'
if os.path.exists(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Check if groq is in the requirements
    if 'groq' not in content.lower():
        content = content.strip() + '\ngroq\n'
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        print('groq added to requirements.txt successfully!')
    else:
        print('groq is already in requirements.txt!')
else:
    # Create the requirements.txt with the necessary packages
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write('flask\nflask-cors\ngroq\n')
    print('requirements.txt created successfully!')