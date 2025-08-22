import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/tasks - Get all tasks
export async function GET() {
  try {
    const tasks = await prisma.task.findMany({
      orderBy: {
        createdAt: 'desc'
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

    // Transform the data to match the frontend interface
    const transformedTasks = tasks.map(task => ({
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
    }));

    return NextResponse.json(transformedTasks);
  } catch (error) {
    console.error('Error fetching tasks:', error);
    return NextResponse.json(
      { error: 'Failed to fetch tasks' },
      { status: 500 }
    );
  }
}

// POST /api/tasks - Create a new task
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      title,
      description,
      customerId,
      customerName,
      priority,
      assignedTo,
      dueDate
    } = body;

    // Validate required fields
    if (!title || !customerId) {
      return NextResponse.json(
        { error: 'Title and Customer are required' },
        { status: 400 }
      );
    }

    // Verify customer exists
    const customer = await prisma.customer.findUnique({
      where: { id: customerId }
    });

    if (!customer) {
      return NextResponse.json(
        { error: 'Customer not found' },
        { status: 400 }
      );
    }

    const task = await prisma.task.create({
      data: {
        title,
        description: description || '',
        status: 'todo',
        priority: priority || 'medium',
        customerId,
        assignedTo: assignedTo || null,
        dueDate: dueDate ? new Date(dueDate) : null
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

    return NextResponse.json(transformedTask, { status: 201 });
  } catch (error) {
    console.error('Error creating task:', error);
    return NextResponse.json(
      { error: 'Failed to create task' },
      { status: 500 }
    );
  }
} 