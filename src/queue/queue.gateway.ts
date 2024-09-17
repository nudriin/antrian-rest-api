import {
    ConnectedSocket,
    MessageBody,
    SubscribeMessage,
    WebSocketGateway,
    WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { QueueService } from './queue.service';
import { OnModuleInit } from '@nestjs/common';

@WebSocketGateway({
    cors: {
        origin: '*',
    },
})
export class QueueGateway implements OnModuleInit {
    constructor(private queueService: QueueService) {}

    @WebSocketServer()
    server: Server;

    onModuleInit() {
        this.server.on('connection', (socket: Socket) => {
            console.log(`Socket connected: ${socket.id}`);
        });
    }

    @SubscribeMessage('getTotalQueue')
    async getTotalQueueToday(
        @MessageBody() data: number,
        @ConnectedSocket() client: Socket,
    ): Promise<void> {
        const result =
            await this.queueService.countTotalQueueByDateAndLocket(data);

        console.log(client.id);
        console.log('SOCKET REQUEST : ', data);
        console.log('SOCKET IO : ', result);
        this.server.emit('total', result);
    }

    @SubscribeMessage('getCurrentQueue')
    async currentQueue(
        @MessageBody() data: number,
        @ConnectedSocket() client: Socket,
    ): Promise<void> {
        const result = await this.queueService.findCurrentQueue(data);

        console.log(client.id);
        console.log('SOCKET REQUEST : ', data);
        console.log('SOCKET IO : ', result);
        this.server.emit('currentQueue', result);
    }

    @SubscribeMessage('getRemainQueue')
    async remainQueue(
        @MessageBody() data: number,
        @ConnectedSocket() client: Socket,
    ): Promise<void> {
        const result = await this.queueService.findRemainderQueue(data);

        console.log(client.id);
        console.log('SOCKET REQUEST : ', data);
        console.log('SOCKET IO : ', result);
        this.server.emit('remainQueue', result);
    }

    @SubscribeMessage('getNextQueue')
    async nextQueue(
        @MessageBody() data: number,
        @ConnectedSocket() client: Socket,
    ): Promise<void> {
        const result = await this.queueService.findNextQueue(data);

        console.log(client.id);
        console.log('SOCKET REQUEST : ', data);
        console.log('SOCKET IO : ', result);
        this.server.emit('nextQueue', result);
    }
}
