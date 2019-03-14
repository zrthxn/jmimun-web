/**
 * @author zrthxn
 * Content Delivery Library
 */
const fs = require('fs');

exports.Lookup = (fileRef) => {
    var fileId = parseInt(fileRef, 36)
    /**
     * @author zrthxn
     * This function does the searching part and it has to be made fast
     * See the cdn folder for a clearer view of this
     * The file called cdnJookup.js is the lookup table
     * Inside that you'll see "$schema" and that sorta describes how data will eventually be stored
     */
    return new Promise((resolve,reject)=>{
        fs.readFile('./cdn/cdnLookup.json', (err, lookup) => {
            if(err) reject('LOOKUP_ERROR',err)

            let files = JSON.parse(lookup).files;
            let index = findFileById(files, fileId, 0, files.length-1)
            if(index !== -1)
                resolve(files[index])

            reject("FILE_NOT_FOUND") 
        })
    })
}

exports.Upload = (file, filepath, metadata = {}) => {
    var genFileRef = generateFileRef()
    var genFileId = parseInt(genFileRef, 36)
    /**
     * @author zrthxn
     * The array called "files" in the lookup table file 
     * has to be sorted each time a new file is added
     */
    return new Promise((resolve,reject)=>{
        let lookup = JSON.parse(fs.readFileSync('./cdn/cdnLookup.json').toString())
        let files = lookup.files

        var genFileName = generateFileName()
        var extn = file.name.toString().split('.')
        extn = extn[extn.length - 1]
        genFileName += '.' + extn

        files[ files.length ] = {
            "fileRef": genFileRef,
            "fileId": genFileId,
            "filename": genFileName,
            "originalName": file.name,
            "contentType": file.mimetype,
            "checksum": file.md5,
            "filepath": filepath,
            "metadata": metadata
        }
        
        files = sortFileArrayById (files, 0, files.length-1)
        lookup.files = files

        fs.writeFileSync('./cdn/cdnLookup.json', JSON.stringify(lookup, null, 2))
        fs.writeFile('./cdn/' + filepath + '/' + genFileName, file.data,(err)=>{
            if(err) reject(err)
            resolve(genFileRef)
        })
    })
}

exports.Create = (file, filename, filepath, contentType, metadata = {}) => {
    var genFileRef = generateFileRef()
    var genFileId = parseInt(genFileRef, 36)
    /**
     * @author zrthxn
     * The array called "files" in the lookup table file 
     * has to be sorted each time a new file is added
     */
    return new Promise((resolve,reject)=>{
        let lookup = JSON.parse(fs.readFileSync('./cdn/cdnLookup.json').toString())
        let files = lookup.files

        files[ files.length ] = {
            "fileRef": genFileRef,
            "fileId": genFileId,
            "filename": filename,
            "contentType": contentType,
            "checksum": file.md5,
            "filepath": filepath,
            "metadata": metadata
        }
        
        files = sortFileArrayById (files, 0, files.length-1)
        lookup.files = files

        fs.writeFileSync('./cdn/cdnLookup.json', JSON.stringify(lookup, null, 2))
        fs.writeFile('./cdn/' + filepath + '/' + filename, file,(err)=>{
            if(err) reject(err)
            resolve(genFileRef)
        })
    })
}

function sortFileArrayById (files, low, high){
    // Quick Sort Algorithm with pivot at end
    if (low < high) { 
        var pivot = files[high].fileId    
        var i = low - 1   
        for (var j=low; j<=high-1; j++)
            if (files[j].fileId <= pivot) { 
                i++  
                let temp=files[i]
                files[i]=files[j]
                files[j]=temp 
            } 

        pi=i+1
        let temp=files[pi]
        files[pi]=files[high]
        files[high]=temp
        sortFileArrayById(files, low, pi - 1) 
        sortFileArrayById(files, pi + 1, high)
    }
    return files
}

// ============================================================= //

function findFileById(fArray, item, lo, hi){
    // Binary Search Algorithm
    if(hi >= lo) {
        var mid = Math.floor((lo + hi) / 2)
        if(item === fArray[mid].fileId)
            return mid
        else if (item > fArray[mid].fileId)
            return findFileById(fArray, item, mid + 1, hi)
        
        return findFileById(fArray, item, lo, mid - 1)
    }
    return -1
}

function generateFileRef() {
    let fileRef = '', date = new Date()
    let lookupTable = JSON.parse(fs.readFileSync('./cdn/cdnLookup.json').toString())
    lookupTable.fileRefNumber++
    
    let day = date.getDate()>=10 ? (date.getDate()).toString() : '0' + (date.getDate()).toString() 
    let month = date.getMonth()>=9 ? (date.getMonth() + 1).toString() : '0' + (date.getMonth() + 1).toString()
    let dateDesgn = parseInt(day + month).toString(36).substring(1), l = 2 - dateDesgn.length
    for (let i=0; i<l; i++)
        dateDesgn = '0' + dateDesgn

    let flRef = (lookupTable.fileRefNumber).toString(36), k = 2 - flRef.length
    for (let i=0; i<k; i++)
        flRef = '0' + flRef

    fs.writeFileSync('./cdn/cdnLookup.json', JSON.stringify(lookupTable, null, 2))
    fileRef =  dateDesgn + flRef

    return fileRef
}

function generateFileName() {
    let fileName = 'upload_'
    for (let i=0; i<24; i++)
        fileName += Math.floor( Math.random()*36 ).toString(36)
    return fileName
}