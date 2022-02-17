# Shopout Server

**_The backend for the shopout app built using NodeJS and MongoDB. Hosted on Heroku._**

## A. Setup 🏗️

🚨 Only use `npm` for package management and not `yarn`

### 1. Fork and clone the repository

- Make a local fork of this repository by clicking on the 'fork' button available on the top right extreme, just below your avatar.
- Go to your local fork, it would be named as `<your-github-username>/shopout-server` and clone the repository on your local machine. You can use this bash command for cloning just replace your username:
  ```bash
  git clone git@github.com:<username>/shopout-server.git
  ```

### 2. Install dependencies

- From the repository root run:
  ```bash
  npm i
  ```
- This will install all required dependencies in the `node_modules` folder in the root of the directory/repository.

### 3. Start the local server

- Start the local server using
  ```bash
  npm run dev
  ```
- This will start the server, by default, on port `5000`. If that port is busy, change its value in `.env`.
- The terminal should output a message of the form:
  ```bash
  Server running on PORT 5000
  ```
- If there is an issue please view the troubleshooting section.

### 4. Editor/IDE Setup

✅ We recommend using [VSCode](https://code.visualstudio.com/) for this project.

- Make sure you have enabled ESLint and Prettier extensions in your IDE/Editor.
- Follow these formatting guidelines:
  - Tab Space: 2
  - Single quotes for `import` and `require`

## B. Making Changes ⚙️

### 1. Commit messages

- Ensure your commit messages are descriptive and intuitive for use. Split multiple jobs into multiple commits wherein every commit deals specifically with a single issue/enhancement.
- Follow these [guidelines](https://www.freecodecamp.org/news/writing-good-commit-messages-a-practical-guide/) for descriptive commit messages.

### 2. Linting

- Before adding/committing your changes locally, do check for all linting errors in your work.
- Run this command to automatically fix most errors:
  ```bash
  npm run lint-fix
  ```
- Review the command line output for some errors/warnings in the code you added.

### 3. Pull Requests

🚨 Never directly push your changes to upstream i.e. `datacquity/shopout-server`.

- Always push changes to your local fork and then create a PR to the upstream.
- Make sure the PR is descriptive and clearly indicates the changes made, special tasks for the reviewer etc.

## C. Troubleshooting 🐛

🚨 Make sure you have a node version > v10 and a corresponding npm version as well.

1. Error: `Error!Error: querySrv EREFUSED`

   - **Disable Antivirus/Firewall**: Your firewall maybe blocking your connection to MongoDB Atlas. Disable the protection and then restart your terminal/IDE and run the start command again.
   - **Use the old connection string**: The connection may be denied due to conflicting node versions. Go to the `.env` file and copy the string in `OLD_SRV_STRING` to `DB_URL`. Restart the terminal/IDE and run the start script.

2. Error: `Port already in use`
   - **Change PORT variable**: You might have a process already running in port 5000. To fix this, change the `PORT` variable in `.env` file to 8000/8080/3000 etc. and run the start command again.
