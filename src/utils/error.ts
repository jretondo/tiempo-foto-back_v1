const err = (message: string) => {
    let e: Error = new Error(message)
    return e
};

export = err
