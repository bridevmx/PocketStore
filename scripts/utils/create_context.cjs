const fs = require('fs');
const path = require('path');

function getFilesContent(dir, allContent = '') {
  const files = fs.readdirSync(dir);

  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    // Regla 1: Excluir la carpeta /scripts/utils
    if (stat.isDirectory() && filePath.includes(path.join('scripts', 'utils'))) {
      console.log(`Excluyendo directorio: ${filePath}`);
      return;
    }

    // Regla 2: Excluir el archivo pocketbase.exe
    if (!stat.isDirectory() && filePath.includes(path.join('scripts', 'pocketbase', 'pocketbase.exe'))) {
      console.log(`Excluyendo archivo: ${filePath}`);
      return;
    }

    // Regla 3: Excluir la carpeta /scripts/pocketbase/pb_data
    if (stat.isDirectory() && filePath.includes(path.join('scripts', 'pocketbase', 'pb_data'))) {
      console.log(`Excluyendo directorio: ${filePath}`);
      return;
    }

    if (stat.isDirectory()) {
      allContent = getFilesContent(filePath, allContent);
    } else {
      try {
        const content = fs.readFileSync(filePath, 'utf8');
        allContent += `\n\n ---\n\n${filePath}\n${content}`;
        console.log(`Analizado: ${filePath}`);
      } catch (error) {
        console.error(`Error procesando ${filePath}: ${error.message}`);
      }
    }
  });

  return allContent;
}

// Procesar la carpeta /src
// Corregir la ruta para subir dos niveles y acceder a la carpeta 'src'
let allFilesContent = getFilesContent(path.join(__dirname, '..', '..', 'src'));

// Procesar la carpeta /scripts
// La ruta para la carpeta 'scripts' también debe subir dos niveles y luego ir a 'scripts'
allFilesContent = getFilesContent(path.join(__dirname, '..', '..', 'scripts'), allFilesContent);

fs.writeFileSync(path.join(__dirname, '.', 'context.txt'), allFilesContent);
console.log('Todos los archivos combinados en ./scripts/utils/context.txt');