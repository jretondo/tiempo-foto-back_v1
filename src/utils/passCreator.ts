export const passCreator = async (): Promise<any> => {
    const cadenaLarga = "QWERTYUIOPASDFGHJKLZXCVBNM12345678909876543210mnbvcxzlkjhgfdsapoiuytrewq"
    let rndm = 0

    const nvaPass = new Promise((resolve, reject) => {
        let pass = ""
        while (pass.length < 10) {
            rndm = Math.round(Math.random() * 72)
            pass = pass + cadenaLarga.substring(rndm, (rndm + 1))
        }
        resolve(pass);
    });

    return (nvaPass);
}