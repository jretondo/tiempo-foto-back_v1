export function zfill(number: number, width: number) {
    let numberOutput = Math.abs(number); /* Valor absoluto del número */
    let length = String(number).length; /* Largo del número */
    let zero = "0"; /* String de cero */

    if (width <= length) {
        if (number < 0) {
            return ("-" + String(numberOutput));
        } else {
            return String(numberOutput);
        }
    } else {
        if (number < 0) {
            return ("-" + (zero.repeat(width - length)) + String(numberOutput));
        } else {
            return ((zero.repeat(width - length)) + String(numberOutput));
        }
    }
}