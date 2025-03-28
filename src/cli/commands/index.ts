import { MoveCommand } from './MoveCommand';
import { WallCommand } from './WallCommand';
import { StatusCommand } from './StatusCommand';
import { Command } from '../types/Command';

export const commands: Command[] = [
    new MoveCommand(),
    new WallCommand(),
    new StatusCommand()
]; 