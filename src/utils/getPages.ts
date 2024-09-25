const getPages = async (totalReg: number, cantPerPage: number, pageAct: number) => {
    let ultPagina = 1
    let paginas: Array<number> = []
    if (totalReg === 0) {
        return {
            cantTotal: 0,
            totalPag: 0
        }
    } else {
        if (totalReg < cantPerPage) {
            paginas.push(1)
            return {
                cantTotal: paginas,
                totalPag: ultPagina
            }
        } else {
            return new Promise((resolve, reject) => {
                const paginasFloat = totalReg / cantPerPage
                const paginasInt: number = Math.round(totalReg / cantPerPage)
                let totalPag
                if (paginasFloat > paginasInt) {
                    totalPag = paginasInt + 1
                } else {
                    if (paginasInt === 0) {
                        totalPag = 1
                    } else {
                        totalPag = paginasInt
                    }
                }

                ultPagina = totalPag

                for (let i = 0; i < totalPag; i++) {
                    const paginaLista = i + 1
                    const limiteInf = (pageAct) - 3
                    const limiteSup = (pageAct) + 3
                    if (paginaLista > limiteInf && paginaLista < limiteSup)
                        paginas.push(paginaLista)
                }
                resolve({
                    cantTotal: paginas,
                    totalPag: ultPagina
                })
            })
        }
    }
}

export = getPages