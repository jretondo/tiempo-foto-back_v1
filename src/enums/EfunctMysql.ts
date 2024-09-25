export enum EModeWhere {
    strict,
    like,
    dif,
    higher,
    higherEqual,
    less,
    lessEqual
}

export enum EConcatWhere {
    and,
    or,
    none
}

export enum ESelectFunct {
    count = 'COUNT',
    all = '*',
    sum = 'SUM',
    max = 'MAX',
    prepAlias = 'AS'
}

export enum EPermissions {
    ptosVta = 1,
    productos = 2,
    ventas = 3,
    proveedores = 4,
    clientes = 5,
    anularFact = 6,
    userAdmin = 8,
    stock = 9
}

export enum ETypesJoin {
    left = "LEFT",
    right = "RIGHT",
    none = ""
}