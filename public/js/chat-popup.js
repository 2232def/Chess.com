// Chat toggle functionality with animation
(function() {
  'use strict';

  document.addEventListener('DOMContentLoaded', function() {
    const chatBox = document.querySelector('.chat-box');
    const chatGround = document.querySelector('.chat-ground');
    
    if (!chatBox || !chatGround) {
      console.warn('Chat elements not found');
      return;
    }

    // Initially hide the chat ground
    chatGround.style.display = 'none';
    chatGround.style.opacity = '0';
    chatGround.style.transform = 'translateY(-10px)';
    chatGround.style.transition = 'opacity 0.3s ease, transform 0.3s ease';

    let isChatOpen = false;

    // Toggle chat on click
    chatBox.addEventListener('click', function(e) {
      e.stopPropagation();
      
      if (isChatOpen) {
        // Close chat with animation
        chatGround.style.opacity = '0';
        chatGround.style.transform = 'translateY(-10px)';
        
        setTimeout(function() {
          chatGround.style.display = 'none';
        }, 300); // Wait for animation to complete
        
        isChatOpen = false;
      } else {
        // Open chat with animation
        chatGround.style.display = 'block';
        
        // Force reflow to trigger animation
        chatGround.offsetHeight;
        
        requestAnimationFrame(function() {
          chatGround.style.opacity = '1';
          chatGround.style.transform = 'translateY(0)';
        });
        
        isChatOpen = true;
      }
    });

    // Close chat when clicking outside
    document.addEventListener('click', function(e) {
      if (isChatOpen && !chatGround.contains(e.target) && !chatBox.contains(e.target)) {
        chatGround.style.opacity = '0';
        chatGround.style.transform = 'translateY(-10px)';
        
        setTimeout(function() {
          chatGround.style.display = 'none';
        }, 300);
        
        isChatOpen = false;
      }
    });

    // Prevent clicks inside chat ground from closing it
    chatGround.addEventListener('click', function(e) {
      e.stopPropagation();
    });
  });
})();
