#!/usr/bin/env node

/**
 * Script para verificar archivos obsoletos en el proyecto
 * Ejecutar con: node scripts/check-obsolete-files.js
 */

const fs = require('fs')
const path = require('path')
const { execSync } = require('child_process')

const obsoleteFiles = [
  'src/components/dashboard/sidebar-agricultor.tsx',
  'src/components/dashboard/sidebar-empresa.tsx',
  'src/components/mobile/bottom-nav-agricultor.tsx',
  'src/components/mobile/bottom-nav-empresa.tsx',
]

const filesToReview = [
  'src/components/dashboard/sidebar.tsx',
  'src/components/mobile/bottom-nav.tsx',
]

console.log('🔍 Verificando archivos obsoletos...\n')

// Verificar archivos obsoletos
console.log('❌ Archivos Obsoletos (deberían eliminarse):')
console.log('─'.repeat(60))

obsoleteFiles.forEach(file => {
  const fullPath = path.join(process.cwd(), file)
  const exists = fs.existsSync(fullPath)
  
  if (exists) {
    try {
      // Buscar referencias al archivo
      const searchPattern = file.split('/').pop().replace('.tsx', '')
      const result = execSync(
        `grep -r "${searchPattern}" src --exclude-dir=node_modules --exclude="*.md" || true`,
        { encoding: 'utf-8', cwd: process.cwd() }
      )
      
      const references = result.trim().split('\n').filter(line => line && !line.includes('check-obsolete'))
      
      if (references.length > 0) {
        console.log(`⚠️  ${file}`)
        console.log(`   Referencias encontradas: ${references.length}`)
        references.slice(0, 3).forEach(ref => {
          console.log(`   - ${ref.split(':')[0]}`)
        })
        if (references.length > 3) {
          console.log(`   ... y ${references.length - 3} más`)
        }
      } else {
        console.log(`✅ ${file} - Seguro para eliminar (sin referencias)`)
      }
    } catch (error) {
      console.log(`✅ ${file} - Seguro para eliminar`)
    }
  } else {
    console.log(`❓ ${file} - No existe`)
  }
})

console.log('\n')
console.log('⚠️  Archivos a Revisar (aún en uso pero deberían migrarse):')
console.log('─'.repeat(60))

filesToReview.forEach(file => {
  const fullPath = path.join(process.cwd(), file)
  const exists = fs.existsSync(fullPath)
  
  if (exists) {
    try {
      const searchPattern = file.split('/').pop().replace('.tsx', '')
      const result = execSync(
        `grep -r "${searchPattern}" src --exclude-dir=node_modules --exclude="*.md" || true`,
        { encoding: 'utf-8', cwd: process.cwd() }
      )
      
      const references = result.trim().split('\n').filter(line => line && !line.includes('check-obsolete'))
      
      console.log(`📄 ${file}`)
      if (references.length > 0) {
        console.log(`   Referencias: ${references.length}`)
        references.slice(0, 3).forEach(ref => {
          const filePath = ref.split(':')[0]
          console.log(`   - ${filePath}`)
        })
      }
    } catch (error) {
      console.log(`   No se pudo verificar`)
    }
  }
})

console.log('\n')
console.log('✅ Verificación completada')
console.log('\nPara más detalles, ver: ARCHIVOS_OBSOLETOS.md')

