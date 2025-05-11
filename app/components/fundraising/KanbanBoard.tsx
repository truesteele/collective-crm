import DealCard from './DealCard';

// ... existing code ...

// Inside the Droppable component, find this section:
{provided.placeholder}
{column.deals.map((deal, index) => (
  <Draggable
    key={deal.id}
    draggableId={deal.id}
    index={index}
  >
    {(provided, snapshot) => (
      <div
        ref={provided.innerRef}
        {...provided.draggableProps}
        {...provided.dragHandleProps}
        style={{
          ...provided.draggableProps.style,
          opacity: snapshot.isDragging ? 0.8 : 1,
        }}
      >
        <DealCard deal={deal} />
      </div>
    )}
  </Draggable>
))}

// ... existing code ... 