import os

# Set the directory you want to start from
rootDir = './src/'

# Open the log file for writing
with open('scan_log.txt', 'w') as log_file:
  for dirName, subdirList, fileList in os.walk(rootDir):
      # Skip the node_modules directory and all its subdirectories
      subdirList[:] = [d for d in subdirList if d != 'node_modules']
      # Remove the yarn-error.log and yarn.lock files from the file list
      fileList = [f for f in fileList if f != 'yarn-error.log' and f != 'yarn.lock']
      log_file.write('Found directory: %s\n' % dirName)
      for fname in fileList:
          file_path = os.path.join(dirName, fname)
          log_file.write('\t// file: %s\n' % file_path)
          with open(file_path, 'r') as f:
              log_file.write(f.read())
