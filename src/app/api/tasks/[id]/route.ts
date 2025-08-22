import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/tasks/[id] - Get a single task
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const task = await prisma.task.findUnique({
      where: { id: params.id },
      include: {
        customer: {
          select: {
            customerName: true,
            company: true
          }
        }
      }
    });

    if (!task) {
      return NextResponse.json(
        { error: 'Task not found' },
        { status: 404 }
      );
    }

    // Transform the data to match the frontend interface
    const transformedTask = {
      id: task.id,
      title: task.title,
      description: task.description,
      status: task.status,
      priority: task.priority,
      customerId: task.customerId,
      customerName: task.customer.customerName,
      assignedTo: task.assignedTo,
      dueDate: task.dueDate?.toISOString().split('T')[0] || '',
      createdAt: task.createdAt.toISOString(),
      updatedAt: task.updatedAt.toISOString()
    };

    return NextResponse.json(transformedTask);
  } catch (error) {
    console.error('Error fetching task:', error);
    return NextResponse.json(
      { error: 'Failed to fetch task' },
      { status: 500 }
    );
  }
}

// PUT /api/tasks/[id] - Update a task
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { status, title, description, priority, assignedTo, dueDate } = body;

    // Check if task exists
    const existingTask = await prisma.task.findUnique({
      where: { id: params.id }
    });

    if (!existingTask) {
      return NextResponse.json(
        { error: 'Task not found' },
        { status: 404 }
      );
    }

    // Update the task
    const task = await prisma.task.update({
      where: { id: params.id },
      data: {
        ...(status && { status }),
        ...(title && { title }),
        ...(description !== undefined && { description }),
        ...(priority && { priority }),
        ...(assignedTo !== undefined && { assignedTo }),
        ...(dueDate !== undefined && { dueDate: dueDate ? new Date(dueDate) : null })
      },
      include: {
        customer: {
          select: {
            customerName: true,
            company: true
          }
        }
      }
    });

    // Transform the response to match frontend interface
    const transformedTask = {
      id: task.id,
      title: task.title,
      description: task.description,
      status: task.status,
      priority: task.priority,
      customerId: task.customerId,
      customerName: task.customer.customerName,
      assignedTo: task.assignedTo,
      dueDate: task.dueDate?.toISOString().split('T')[0] || '',
      createdAt: task.createdAt.toISOString(),
      updatedAt: task.updatedAt.toISOString()
    };

    return NextResponse.json(transformedTask);
  } catch (error) {
    console.error('Error updating task:', error);
    return NextResponse.json(
      { error: 'Failed to update task' },
      { status: 500 }
    );
  }
}

// DELETE /api/tasks/[id] - Delete a task
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check if task exists
    const existingTask = await prisma.task.findUnique({
      where: { id: params.id }
    });

    if (!existingTask) {
      return NextResponse.json(
        { error: 'Task not found' },
        { status: 404 }
      );
    }

    await prisma.task.delete({
      where: { id: params.id }
    });

    return NextResponse.json({ message: 'Task deleted successfully' });
  } catch (error) {
    console.error('Error deleting task:', error);
    return NextResponse.json(
      { error: 'Failed to delete task' },
      { status: 500 }
    );
  }
} 