import { config } from '../config'
import path from 'path'
import tinify from 'tinify'
tinify.key = config.tinify.key

const OptimizeImg = async (file: string) => {
    const directory = path.join(__dirname, '..', '..', 'public', 'images', 'products', file)

    const source = tinify.fromFile(directory);
    const resized = source.resize({
        method: "cover",
        width: 600,
        height: 600
    });
    await resized.toFile(directory);
}

export = OptimizeImg