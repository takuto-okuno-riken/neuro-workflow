import { 
  Flex, 
  Heading, 
  Button, 
  Spacer,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Box
} from '@chakra-ui/react'
import { Link as RouterLink } from 'react-router-dom'
import { ChevronDownIcon } from '@chakra-ui/icons'

const Header: React.FC = () => {
  

  return (
    <>
     <Flex
      as="header"
      width="100%"
      py={4}
      px={6}
      alignItems="center"
      bg="gray.900"
      color="white"
      position="fixed"  
      top="0"          
      zIndex="1000"    
    >
      <Heading 
          as={RouterLink} 
          to="/" 
          size="md" 
          letterSpacing="tight" 
          fontWeight="bold"
          cursor="pointer" 
        >
          Neuro-workflow
      </Heading>
      
      <Spacer />
      
      <Flex>
        {/* File Menu */}
        <Menu>
          <MenuButton 
            as={Button}
            variant="ghost" 
            colorScheme="white" 
            size="md" 
            mx={2}
            rightIcon={<ChevronDownIcon />}
          >
            File
          </MenuButton>
          <MenuList bg="gray.800" borderColor="gray.700">
            <MenuItem as={RouterLink} to="/file/new" bg="gray.800" _hover={{ bg: "gray.700" }}>New</MenuItem>
            <MenuItem as={RouterLink} to="/file/open" bg="gray.800" _hover={{ bg: "gray.700" }}>Open</MenuItem>
            <MenuItem as={RouterLink} to="/file/save" bg="gray.800" _hover={{ bg: "gray.700" }}>Save</MenuItem>
            <MenuItem as={RouterLink} to="/file/close" bg="gray.800" _hover={{ bg: "gray.700" }}>Close</MenuItem>
          </MenuList>
        </Menu>

        {/* Box Menu */}
        <Menu>
          <MenuButton 
            as={Button}
            variant="ghost" 
            colorScheme="white" 
            size="md" 
            mx={2}
            rightIcon={<ChevronDownIcon />}
          >
            Box
          </MenuButton>
          <MenuList bg="gray.800" borderColor="gray.700">
            <MenuItem as={RouterLink} to="/box/upload" bg="gray.800" _hover={{ bg: "gray.700" }}>Upload</MenuItem>        
          </MenuList>
        </Menu>

        {/* Settings Menu */}
        <Menu>
          <MenuButton 
            as={Button}
            variant="ghost" 
            colorScheme="white" 
            size="md" 
            mx={2}
            rightIcon={<ChevronDownIcon />}
          >
            Settings
          </MenuButton>
          <MenuList bg="gray.800" borderColor="gray.700">
            <MenuItem as={RouterLink} to="/settings/server" bg="gray.800" _hover={{ bg: "gray.700" }}>Server</MenuItem>
          </MenuList>
        </Menu>
      </Flex>
    </Flex>
    <Box height="72px" /> {/* Spacer to prevent content from being hidden under fixed header */}
    </>    
  )
}

export default Header
