
import { createSolvedCube, applyMove, cubeFacesToFacelets, type CubeFaces } from './lib/cube-faces'
import { createSolvedState, applyMove as applyMoveState } from './lib/cube-state'

const MOVES = [
    'U', "U'", 'U2',
    'D', "D'", 'D2',
    'L', "L'", 'L2',
    'R', "R'", 'R2',
    'F', "F'", 'F2',
    'B', "B'", 'B2'
]

export async function runDesyncCheck() {
    console.log('Starting Desync Check...')

    // Test 1: Single Moves
    for (const move of MOVES) {
        const faces = applyMove(createSolvedCube(), move)
        const facesStr = cubeFacesToFacelets(faces)

        const state = await createSolvedState()
        const newState = await applyMoveState(state, move)
        const stateStr = newState.facelets

        if (facesStr !== stateStr) {
            console.error(`MISMATCH on move ${move}!`)
            console.log('Faces:', facesStr)
            console.log('State:', stateStr)
            return
        }
    }
    console.log('Single move tests passed.')

    // Test 2: Random Sequences
    for (let i = 0; i < 20; i++) {
        const len = 10
        const sequence = []
        for (let j = 0; j < len; j++) sequence.push(MOVES[Math.floor(Math.random() * MOVES.length)])

        let faces = createSolvedCube()
        let state = await createSolvedState()

        for (const move of sequence) {
            faces = applyMove(faces, move)
            state = await applyMoveState(state, move)
        }

        const facesStr = cubeFacesToFacelets(faces)
        const stateStr = state.facelets

        if (facesStr !== stateStr) {
            console.error(`MISMATCH on sequence ${sequence.join(' ')}!`)
            console.log('Faces:', facesStr)
            console.log('State:', stateStr)
            return
        }
    }
    console.log('Random sequence tests passed.')
}

runDesyncCheck().catch(console.error)
